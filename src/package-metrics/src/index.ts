import { GroupMetric, LicenseMetric, RampUpMetric, BusFactorMetric, CorrectnessMetric, ResponsiveMetric, VersionMetric, PullRequestMetric } from "./metric";
import { GithubRepository } from "./github_repository";
import { Repository } from "./repository";
import { exec } from "child_process";

import { open } from 'node:fs/promises';
import { promisify } from "util";

// read environment variable LOG_LEVEL to set up logging
export function get_log_level():string {
	if (process.env.LOG_LEVEL == undefined) {
		console.log("LOG_LEVEL undefined, default emerg");
		return 'emerg';
	}
	else {
		const log_level:string|undefined = process.env.LOG_LEVEL;
		const int_level:number = parseInt(log_level);
		if (int_level == 0) {
			return 'emerg';
		}
		else if (int_level == 1) {
			return 'info';
		}
		else if (int_level == 2) {
			return 'debug';
		}
		else {
			return 'emerg';
		}
	}
}

// read environment variable LOG_FILE to set up logging
export function get_log_file():string {
	if (process.env.LOG_FILE == undefined) {
		console.log("LOG_FILE undefined, default ./logs/default.log");
		return './logs/default.log';
	}
	else {
		const log_file:string|undefined = process.env.LOG_FILE;
		if (log_file == "") {
			console.log("LOG_FILE empty, default ./logs/default.log");
			return './logs/default.log';
		}
		return log_file;
	}
}

export async function get_file_lines(filename:string):Promise<string[]> {
	const file = await open(filename);
	const rv:string[] = [];
	for await (const line of file.readLines()) {
		rv.push(line);
	}

	return new Promise((resolve) => {
		resolve(rv);
	});
}

export class OwnerAndRepo {
	url:string;
	owner:string;
	repo:string;
	cloning_url:string;
	constructor(url:string, owner:string, repo:string, cloning_url:string) {
		this.url = url;
		this.owner = owner;
		this.repo = repo;
		this.cloning_url = cloning_url;
	}
}

export async function fetch_npm_registry_data(registry_url:string):Promise<string[]> {
	let url_obj:URL;
	let git_url:string
	let owner_repo:string[] = [];
	try {
		url_obj = new URL(registry_url);
	} catch(error) {
		logger.log('info', "Invalid registry URL input!");
		return new Promise((reject) => {
			reject(owner_repo);
		});
	}
	
	if (registry_url != null) {
		try {
			const endpoint = registry_url;
			const res = await fetch(endpoint);
			const data = await res.json();
			git_url = data.repository.url;
			try {
				url_obj = new URL(git_url);
			} catch(error) {
				logger.log('error', "Invalid repository url from npm registry!");
				return new Promise((reject) => {
					reject(owner_repo);
				});
			}
			const hostname:string = url_obj.host;
			if (hostname != "github.com") {
				logger.log('error', "Repository url from npm registry not on github!");
				return new Promise((reject) => {
					reject(owner_repo);
				});
			}
			let pathname:string = url_obj.pathname;
			if (pathname.startsWith("/")) {
				pathname = pathname.slice(1);
			}
			const url_owner:string = pathname.slice(0, pathname.indexOf("/"));
			let url_repo:string = pathname.slice(pathname.indexOf("/") + 1);
			
			if (url_repo.endsWith(".git")) {
				url_repo = url_repo.split(".git")[0];
			}
			owner_repo.push(url_owner);
			owner_repo.push(url_repo);
			
			const protocol:string = git_url.slice(0, git_url.indexOf(":"));
			// handle cloning url (form exactly like sample github urls)
			if (protocol.startsWith("https")) {
				owner_repo.push(git_url);
			}
			else if (protocol.startsWith("git+https")) {
				// remove git+ from beginning
				const new_url = git_url.slice(git_url.indexOf("+") + 1);
				owner_repo.push(new_url);
				// remove .git from end
			}
			else if (protocol.startsWith("git+ssh")) {
				// remove until :, replace with https:
				let new_url = "https:" + git_url.slice(git_url.indexOf(":") + 1);
				// remove git@
				new_url = new_url.replace("git@", "");
				owner_repo.push(new_url);
			}
			else {
				logger.log('error', "invalid repo URL from npm registry " + registry_url);
				return new Promise((reject) => {
					reject(owner_repo);
				});
			}
		} catch(error) {
			logger.log('error', "Could not fetch repo URL from npm registry " + registry_url);
			owner_repo = [];
			return new Promise((reject) => {
				reject(owner_repo);
			});
		}
	}
	return new Promise((resolve) => {
		resolve(owner_repo);
	});
}

export async function get_real_owner_and_repo(url_val:string):Promise<OwnerAndRepo|null> {
	let url_obj:URL;
	try {
		url_obj = new URL(url_val);
	} catch(error) {
		logger.log('info', "Invalid URL input!");
		return null;
	}

	const host:string = url_obj.host;
	let pathname:string = url_obj.pathname;
	if (host == "github.com") {
		if (pathname.startsWith("/")) {
			pathname = pathname.slice(1);
		}
		const url_owner:string = pathname.slice(0, pathname.indexOf("/"));
		const url_repo:string = pathname.slice(pathname.indexOf("/") + 1);
		return new OwnerAndRepo(url_val, url_owner, url_repo, url_val);
	}
	else if (host == "www.npmjs.com") {
		const package_name:string = pathname.slice(pathname.lastIndexOf("/"));
		const registry_url:string = "https://registry.npmjs.org" + package_name;
		try {
			let owner_and_repo:string[] = [];
			try {
				owner_and_repo = await fetch_npm_registry_data(registry_url);
			} catch (error) {
				return null;
			}
			if (owner_and_repo.length != 0) {
				return new OwnerAndRepo(url_val, owner_and_repo[0], owner_and_repo[1], owner_and_repo[2]);
			}
		} catch (error) {
			return null;
		}
		return null;
	}
	else {
		return null;
	}
}

class MetricsCollection {
	owner_and_repo:OwnerAndRepo;
	private git_repo:Repository;
	license_metric:LicenseMetric;
	ramp_up_metric:RampUpMetric;
	bus_factor_metric:BusFactorMetric;
	correctness_metric: CorrectnessMetric;
	responsiveness_metric: ResponsiveMetric;
	version_metric: VersionMetric;
	pull_request_metric: PullRequestMetric;
		
	constructor(owner_and_repo:OwnerAndRepo, license_metric:LicenseMetric, ramp_up_metric:RampUpMetric, 
	bus_factor_metric:BusFactorMetric, correctness_metric:CorrectnessMetric, responsiveness_metric:ResponsiveMetric,
	version_metric:VersionMetric, pull_request_metric:PullRequestMetric) {
		this.owner_and_repo = owner_and_repo;
		this.git_repo = new GithubRepository(owner_and_repo.url, owner_and_repo.owner, owner_and_repo.repo, owner_and_repo.cloning_url);
		this.license_metric = license_metric;
		this.ramp_up_metric = ramp_up_metric;
		this.bus_factor_metric = bus_factor_metric;
		this.correctness_metric = correctness_metric;
		this.responsiveness_metric = responsiveness_metric;
		this.version_metric = version_metric;
		this.pull_request_metric = pull_request_metric;
	}

	async get_metrics():Promise<Promise<GroupMetric>[]> {
		const promises_of_metrics:Promise<GroupMetric>[] = [];
		promises_of_metrics[0] = this.license_metric.get_metric(this.git_repo);
		promises_of_metrics[1] = this.ramp_up_metric.get_metric(this.git_repo);
		promises_of_metrics[2] = this.bus_factor_metric.get_metric(this.git_repo);
		promises_of_metrics[3] = this.correctness_metric.get_metric(this.git_repo);
		promises_of_metrics[4] = this.responsiveness_metric.get_metric(this.git_repo);
		promises_of_metrics[5] = this.version_metric.get_metric(this.git_repo);
		promises_of_metrics[6] = this.pull_request_metric.get_metric(this.git_repo);
		// this.promises_of_metrics.push(this.<new_metric>.get_metric(this.git_repo));
		return promises_of_metrics;
	}
}

// citation: typing union type arrays
// https://stackoverflow.com/questions/62320779/typescript-how-to-type-an-array-of-number-or-null-elements-where-the-first-elem

interface calcResults {
	(metrics_array:GroupMetric[]): OutputObject[];
}

export async function process_urls(url_vals:string[], callback:calcResults):Promise<OutputObject[]> {
	//var url_vals:string[] = await get_file_lines(filename);
	const metrics_array:GroupMetric[]= [];
	let owner_and_repo:OwnerAndRepo|null;
	let promises_of_metrics:Promise<GroupMetric>[] = [];
	for (const url_val of url_vals) {
		// change this to .then and .catch for error checking
		owner_and_repo = await get_real_owner_and_repo(url_val);
		if (owner_and_repo != null) {
			// var metrics_collection:MetricsCollection = new MetricsCollection(owner_and_repo, new LicenseMetric(), new <NewMetric()>...);
			const metrics_collection:MetricsCollection = new MetricsCollection(owner_and_repo, new LicenseMetric(), 
			new RampUpMetric(), new BusFactorMetric(), new CorrectnessMetric(), new ResponsiveMetric(), new VersionMetric(),
			new PullRequestMetric());
			const tmp_promises:Promise<GroupMetric>[] = await metrics_collection.get_metrics();
			promises_of_metrics = promises_of_metrics.concat(tmp_promises);
		}
		else {
			logger.log('error',"Invalid URL! " + url_val);
			// @everyone add all metrics with null for bogus URLs
			metrics_array.push(new GroupMetric(url_val, "LICENSE_SCORE", null),
			new GroupMetric(url_val, "RAMP_UP_SCORE", null), new GroupMetric(url_val, "BUS_FACTOR_SCORE", null),
			new GroupMetric(url_val, "CORRECTNESS_SCORE", null), new GroupMetric(url_val, "RESPONSIVE_MAINTAINER_SCORE", null));
		}
	} 
	const allPromise = Promise.allSettled(promises_of_metrics);
	let rating:OutputObject[] = [];

	await allPromise.then((value) => {
		logger.log('info', 'Resolved: ' + value);
		const jdata = JSON.parse(JSON.stringify(value));
		for (const result of jdata) {
			switch(result.status) {
				case 'fulfilled': {
					logger.log('debug', 'success => ' + result.value);
					metrics_array.push(result.value);
					break;
				}
				case 'rejected': {
					logger.log('error', 'error => ' + result.reason);
					metrics_array.push(result.value);
					break;
				}
			}
		}
	}).catch((error) => {
		logger.log('error', 'Rejected: ' + error);
	}).finally(() => {
		logger.log('info', "Finished get_metrics for all repos");
		rating = callback(metrics_array);
		// map with keys as url with values for each metric
		// calculate net score, sort by net score, print
	});

	await promisify(exec)(`rm -rf downloads/ && rm -rf local_clones`);

	return rating;
}

type NullNum = number|null;

export class ScoresWithoutNet {
	url:string|null;
	license_score:NullNum;
	ramp_up_score:NullNum;
	bus_factor_score:NullNum;
	correctness_score:NullNum;
	responsive_maintainer_score:NullNum;
	version_score:NullNum;
	pull_request_score:NullNum;
	constructor(url:string|null, lc:NullNum, ru:NullNum, bf:NullNum, cs:NullNum, rm:NullNum, vr:NullNum, pr:NullNum) {
		this.url = url;
		this.license_score = lc;
		this.ramp_up_score = ru;
		this.bus_factor_score = bf;
		this.correctness_score = cs;
		this.responsive_maintainer_score = rm;
		this.version_score = vr;
		this.pull_request_score = pr;
	}
}

export class ScoresWithNet {
	license_score:number;
	ramp_up_score:number;
	bus_factor_score:number;
	correctness_score:number;
	responsive_maintainer_score:number;
	version_score:number;
	pull_request_score:number;
	net_score:number;
	constructor(lc:number, ru:number, bf:number, cs:number, rm:number, vr:number, pr:number, ns:number) {
		this.license_score = lc;
		this.ramp_up_score = ru;
		this.bus_factor_score = bf;
		this.correctness_score = cs;
		this.responsive_maintainer_score = rm;
		this.version_score = vr;
		this.pull_request_score = pr;
		this.net_score = ns;
	}
}

export class OutputObject {
	URL:string;
	NetScore:number;
	RampUp:number;
	Correctness:number;
	BusFactor:number;
	ResponsiveMaintainer:number;
	LicenseScore:number;
	GoodPinningPractice:number;
	PullRequest:number;
	constructor(url:string, ns:number, ru:number, cs:number, bf:number, rm:number, ls:number, vr:number, pr:number) {
		this.URL = url;
		this.LicenseScore = ls;
		this.RampUp = ru;
		this.BusFactor = bf;
		this.Correctness = cs;
		this.ResponsiveMaintainer = rm;
		this.GoodPinningPractice = vr;
		this.PullRequest = pr;
		this.NetScore = ns;
	}
}

export function get_weighted_sum(scores:ScoresWithoutNet):ScoresWithNet {
	let net_score = 0;
	let license_score_calc:NullNum = scores.license_score;
	let ramp_up_score_calc:NullNum = scores.ramp_up_score;
	let bus_factor_score_calc:NullNum = scores.bus_factor_score;
	let correctness_score_calc:NullNum = scores.correctness_score;
	let responsive_maintainer_score_calc:NullNum = scores.responsive_maintainer_score;
	let version_score_calc:NullNum = scores.version_score;
	let pull_request_score_calc:NullNum = scores.pull_request_score;
	let license_score_disp:number;
	let ramp_up_score_disp:number;
	let bus_factor_score_disp:number;
	let correctness_score_disp:number;
	let responsive_maintainer_score_disp:number;
	let version_score_disp:number;
	let pull_request_score_disp:number;
	
	//@Priyanka change implemented metrics to display 0 , unimplemented -1
	if (license_score_calc == null) {
		license_score_calc = 0;
		license_score_disp = 0;
	}
	else {
		license_score_disp = license_score_calc;
	}
	if (ramp_up_score_calc == null) {
		ramp_up_score_calc = 0;
		ramp_up_score_disp = 0;
	}
	else {
		ramp_up_score_disp = ramp_up_score_calc;
	}
	if (bus_factor_score_calc == null) {
		bus_factor_score_calc = 0;
		bus_factor_score_disp = 0;
	}
	else {
		bus_factor_score_disp = bus_factor_score_calc;
	}
	if (correctness_score_calc == null) {
		correctness_score_calc = 0;
		correctness_score_disp = 0;
	}
	else {
		correctness_score_disp = correctness_score_calc;
	}
	if (responsive_maintainer_score_calc == null) {
		responsive_maintainer_score_calc = 0;
		responsive_maintainer_score_disp = 0;
	}
	else {
		responsive_maintainer_score_disp = responsive_maintainer_score_calc;
	}
	if (version_score_calc == null) {
		version_score_calc = 0;
		version_score_disp = 0;
	}
	else {
		version_score_disp = version_score_calc;
	}
	if (pull_request_score_calc == null) {
		pull_request_score_calc = 0;
		pull_request_score_disp = 0;
	}
	else {
		pull_request_score_disp = pull_request_score_calc;
	}
	net_score = license_score_calc * ((0.2 * bus_factor_score_calc) + (0.2 * ramp_up_score_calc) + 
				(0.2 * correctness_score_calc) + (0.2 * responsive_maintainer_score_calc) + (0.1 * version_score_calc) + 
				(0.1 * pull_request_score_calc));
	return new ScoresWithNet(license_score_disp, ramp_up_score_disp, bus_factor_score_disp, 
							correctness_score_disp, responsive_maintainer_score_disp, version_score_disp, pull_request_score_disp, net_score);
}

export function calc_final_result(metrics_array:GroupMetric[]):OutputObject[] {
	logger.log('info', "\nMetrics array of objects for each metric: \n" + JSON.stringify(metrics_array, null, 4));
	const scores_map_with_net = new Map<string, ScoresWithNet>();
	
	for (let i = 0; i < metrics_array.length; i += 7) {
		const single_url_metrics:GroupMetric[] = metrics_array.slice(i, i+7);
		const scores_without_net:ScoresWithoutNet = new ScoresWithoutNet(null, null, null, null, null, null, null, null);
		let url_val = "";

		for (let j = 0; j < single_url_metrics.length; j++) {

			if ((i + j) >= metrics_array.length) {
				break;
			}
			
			if (single_url_metrics[j] == undefined) {
				// do something
				break;
			}
			else if (single_url_metrics[j] == null) {
				// do something
				break;
			}
			url_val = single_url_metrics[j].url;
			scores_without_net.url = url_val;
			switch (j) {
				case(0):
					// license score
					if (single_url_metrics[j] == null) {
						scores_without_net.license_score = null;
					}
					else {
						scores_without_net.license_score = single_url_metrics[j].metric_val;
					}
					break;
				case(1):
					// ramp up score
					if (single_url_metrics[j] == null) {
						scores_without_net.ramp_up_score = null;
					}
					else {
						scores_without_net.ramp_up_score = single_url_metrics[j].metric_val;
					}
					break;
				case(2):
					// bus factor score
					if (single_url_metrics[j] == null) {
						scores_without_net.bus_factor_score = null;
					}
					else {
						scores_without_net.bus_factor_score = single_url_metrics[j].metric_val;
					}
					break;
				case(3):
					// correctness score
					if (single_url_metrics[j] == null) {
						scores_without_net.correctness_score = null;

					}
					else {
						scores_without_net.correctness_score = single_url_metrics[j].metric_val;
					}
					break;
				case(4):
					// responsive score
					if (single_url_metrics[j] == null) {
						scores_without_net.responsive_maintainer_score = null;
					}
					else {
						scores_without_net.responsive_maintainer_score = single_url_metrics[j].metric_val;
					}
					break;
				case(5):
					// version score
					if (single_url_metrics[j] == null) {
						scores_without_net.version_score = null;
					}
					else {
						scores_without_net.version_score = single_url_metrics[j].metric_val;
					}
					break;
				case(6):
					// pull request score
					if (single_url_metrics[j] == null) {
						scores_without_net.pull_request_score = null;
					}
					else {
						scores_without_net.pull_request_score = single_url_metrics[j].metric_val;
					}
					break;
			}
		}
		const net_score_obj:ScoresWithNet = get_weighted_sum(scores_without_net);
		scores_map_with_net.set(url_val, net_score_obj);
	}
	logger.log('debug', "Scores map with net score \n" + scores_map_with_net);
	const scores_map_only_net = new Map<string, number>();
	scores_map_with_net.forEach((value, key) => {
		scores_map_only_net.set(key, value.net_score);
	});
	logger.log('debug', "Scores map with only net score\n" + scores_map_only_net);
	const sortedMap = new Map([...scores_map_only_net.entries()].sort((a, b) => b[1] - a[1]));
	logger.log('debug', "Scores map with only net score sorted \n" + sortedMap);
	const outputArr:OutputObject[] = [];
	sortedMap.forEach((value, key) => {
		const curr_url_scores = scores_map_with_net.get(key);
		if (curr_url_scores != undefined) {
			const output_object:OutputObject = new OutputObject(key, curr_url_scores.net_score,
			curr_url_scores.ramp_up_score, curr_url_scores.correctness_score,
			curr_url_scores.bus_factor_score, curr_url_scores.responsive_maintainer_score,
			curr_url_scores.license_score, curr_url_scores.version_score, curr_url_scores.pull_request_score);
			//console.log(JSON.stringify(output_object));
			outputArr.push(output_object);
		}
	});

	return outputArr;
}
