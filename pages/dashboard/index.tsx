import { Fragment, useEffect, useState } from "react";
import { Dialog, Disclosure, Menu, Transition } from "@headlessui/react";
import { BellIcon, Bars3Icon, XMarkIcon } from "../../components/icons";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";
import useSupabase from "../../hooks/useSupabase";
import { getDegrees, getSingleTerms, addDegree } from "../../utils/bridge";
import { toast } from "react-toastify";
import Link from "next/link";
import Head from "next/head";
import CBox from "../../components/Combobox";

const user = {
	name: "Tom Cook",
	email: "tom@example.com",
	imageUrl: "https://avatars.dicebear.com/api/micah/4.svg",
};
const mjrs = ["BSCSC"];
const minors = ["BA"];
const navigation = [
	{ name: "Dashboard", href: "#", current: true },
	{ name: "Courses", href: "#", current: false },
	{ name: "Professors", href: "#", current: false },
	// { name: "Github", href: "#", current: false },
	{ name: "About", href: "#", current: false },
];
const userNavigation = [
	{ name: "Your Profile", href: "#" },
	{ name: "Settings", href: "#" },
	{ name: "Sign out", href: "#" },
];

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}
const Dashboard = () => {
	const { user: account } = useAuth();
	// if(!account) return <div>loading</div>
	const { supabase } = useSupabase();
	const [majors, setMajors] = useState<{
		id: string;
		value: string;
		type: string;
	}>();
	// const [details, setDetails] = useState<{
	//     major: string;
	//     minor: string;
	// }>({ major: "", minor: "" });
	const [degrees, setDegrees] = useState<
		{
			id: string;
			major: string;
			minor: string;
			created_at: string | null;
			created_by: string;
			last_change: string;
			access: string[];
			count: number;
			courses: number;
		}[]
	>([]);
	const [singles, setSingles] = useState<
		{
			id: string;
			major: string;
			minor: string;
			created_at: string | null;
			created_by: string;
			last_change: string;
			access: string[];
			count: number;
			term: string;
		}[]
	>([]);
	const [recent, setRecent] = useState<
		{
			id: string;
			major: string;
			minor: string;
			created_at: string | null;
			created_by: string;
			last_change: string;
			access: string[];
			count: number;
			courses?: number;
			term?: string;
		}[]
	>([]);
	const [open, setOpen] = useState(false);
	const [mjr, setMajor] = useState("BSCSC");
	const [minor, setMinor] = useState("BA");

	const handleAddDegree = async () => {
		if (!account?.username || !supabase) {
			toast.error("Failed to add degree");
			return;
		}
		const { data, error, success } = await addDegree(
			account?.username.toLowerCase(),
			mjr,
			"BSCSC/BA",
			supabase
		);
		if (!success || data === null) {
			console.log(error);
			toast.error("Failed to add degree");
			return;
		}
		toast.success("Successfully added degree");
		setDegrees((prev) => {
			return [
				...prev,
				{
					...data[0],
					major:
						data[0].major && "name" in data[0].major
							? (data[0].major.name as string)
							: "None",
					courses:
						"Major_Course" in data[0].major &&
						Array.isArray(data[0].major.Major_Course)
							? (data[0].major.Major_Course[0].count as number)
							: 0,
					count:
						data[0].Degree_Term &&
						Array.isArray(data[0].Degree_Term)
							? data[0].Degree_Term.reduce((prev, term) => {
									return term.Degree_Term_Course &&
										!Array.isArray(term.Degree_Term_Course)
										? (term.Degree_Term_Course
												.count as number) + prev
										: prev;
							  }, 0)
							: 0,
				},
			];
		});
	};

	useEffect(() => {
		console.log("fetching data");
		console.log(account);
		if (!account?.username || !supabase) return;
		const getData = async () => {
			const { data, error, success } = await getDegrees(
				account?.username.toLowerCase(),
				supabase
			);

			if (!success || data === null) {
				// HACK: !data is for typescript
				console.log(error);
				toast.error("Failed to fetch data");
				return;
			}
			const degs = data.map((dd) => {
				return {
					...dd,
					major:
						dd.major && "name" in dd.major
							? (dd.major.name as string)
							: "None",
					courses:
						"Major_Course" in dd.major &&
						Array.isArray(dd.major.Major_Course)
							? (dd.major.Major_Course[0].count as number)
							: 0,
					count:
						dd.Degree_Term && Array.isArray(dd.Degree_Term)
							? dd.Degree_Term.reduce((prev, term) => {
									return term.Degree_Term_Course &&
										!Array.isArray(term.Degree_Term_Course)
										? (term.Degree_Term_Course
												.count as number) + prev
										: prev;
							  }, 0)
							: 0,
				};
			});
			setDegrees(degs);
			const {
				data: rawSingles,
				error: singlesErr,
				success: singleSuccess,
			} = await getSingleTerms(account?.username.toLowerCase(), supabase);
			if (!singleSuccess || rawSingles === null) {
				console.log(singlesErr);
				toast.error("Failed to fetch data");
				return;
			}
			const singies = rawSingles.map((single) => {
				return {
					...single,
					minor: single.minor ? single.minor : "N/A",
					count:
						single.Single_Term_Section &&
						!Array.isArray(single.Single_Term_Section)
							? (single.Single_Term_Section.count as number)
							: 0,
				};
			});
			setSingles(singies);
			setRecent(
				[...degs, ...singies]
					.sort((a, b) => {
						return (
							new Date(b.last_change as string).getTime() -
							new Date(a.last_change as string).getTime()
						);
					})
					.slice(0, 5)
			);
		};

		getData();
	}, [account?.username]);
	// const [account, setAccount] = useState(instance.getActiveAccount());
	// useEffect(() => {
	//     console.log(instance.getActiveAccount());
	//     setAccount(instance.getActiveAccount());
	// }, [instance]);

	return (
		<>
			<Head>
				<title>Dashboard - Compass</title>
			</Head>
			<div
				className="h-screen w-screen bg-white text-black overflow-scroll"
				style={{
					background: `linear-gradient(90deg, #d7f4e3 20.8px, transparent 1%) center, linear-gradient(#d7f4e3 20.8px, transparent 1%) center, #000`,
					backgroundSize: "22px 22px",
				}}
			>
				<div className="min-h-full">
					<div className="bg-green-pea pb-32">
						<Disclosure as="nav" className="bg-green-pea">
							{({ open }) => (
								<>
									<div className="mx-auto max-w-7xl sm:px-6 lg:px-8 transition-all font-Poppins">
										<div className="border-b border-light-green">
											<div className="flex h-16 items-center justify-between px-4 sm:px-0">
												<div className="flex items-center">
													<div className="flex-shrink-0">
														<div className="py-2 rounded ml-2 flex justify-start items-center text-white text-2xl">
															<div className="select-none cursor-pointer">
																<h1 className="text-white text-2xl">
																	Compass
																</h1>
																{/* <span className="pr-[0.125rem] font-Raleway">
																	my
																</span>
																<span className="text-white bg-black p-1 px-2 rounded font-bold font-JetBrainsMono">
																	Degree
																</span> */}
															</div>
														</div>
													</div>
													<div className="hidden md:block">
														<div className="ml-10 flex items-baseline space-x-4">
															{navigation.map(
																(item) => (
																	<a
																		key={
																			item.name
																		}
																		href={
																			item.href
																		}
																		className={classNames(
																			item.current
																				? "bg-[#0a401f] text-white"
																				: "text-gray-200 hover:bg-[#0e4524] hover:text-white",
																			"px-3 py-2 rounded-md text-sm font-medium"
																		)}
																		aria-current={
																			item.current
																				? "page"
																				: undefined
																		}
																	>
																		{
																			item.name
																		}
																	</a>
																)
															)}
														</div>
													</div>
												</div>
												<div className="hidden md:block">
													<div className="ml-4 flex items-center md:ml-6">
														<button
															type="button"
															className="rounded-full bg-[#0a401f] p-1 text-gray-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-dark-green"
														>
															<span className="sr-only">
																View
																notifications
															</span>
															<BellIcon />
														</button>

														{/* Profile dropdown */}
														<Menu
															as="div"
															className="relative ml-3"
														>
															<div>
																<Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
																	<span className="sr-only">
																		Open
																		user
																		menu
																	</span>
																	<Image
																		className="h-8 w-8 rounded-full"
																		height={
																			32
																		}
																		width={
																			32
																		}
																		src={
																			user.imageUrl
																		}
																		alt=""
																	/>
																</Menu.Button>
															</div>
															<Transition
																as={Fragment}
																enter="transition ease-out duration-100"
																enterFrom="transform opacity-0 scale-95"
																enterTo="transform opacity-100 scale-100"
																leave="transition ease-in duration-75"
																leaveFrom="transform opacity-100 scale-100"
																leaveTo="transform opacity-0 scale-95"
															>
																<Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
																	{userNavigation.map(
																		(
																			item
																		) => (
																			<Menu.Item
																				key={
																					item.name
																				}
																			>
																				{({
																					active,
																				}) => (
																					<a
																						href={
																							item.href
																						}
																						className={classNames(
																							active
																								? "bg-light-green"
																								: "",
																							"block px-4 py-2 text-sm text-[#0a401f]"
																						)}
																					>
																						{
																							item.name
																						}
																					</a>
																				)}
																			</Menu.Item>
																		)
																	)}
																</Menu.Items>
															</Transition>
														</Menu>
													</div>
												</div>
												<div className="-mr-2 flex md:hidden">
													{/* Mobile menu button */}
													<Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-dark-green p-2 text-gray-200 hover:bg-mid-green hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
														<span className="sr-only">
															Open main menu
														</span>
														{open ? (
															<XMarkIcon />
														) : (
															<Bars3Icon />
														)}
													</Disclosure.Button>
												</div>
											</div>
										</div>
									</div>

									<Disclosure.Panel className="border-b border-light-green md:hidden">
										<div className="space-y-1 px-2 py-3 sm:px-3">
											{navigation.map((item) => (
												<Disclosure.Button
													key={item.name}
													as="a"
													href={item.href}
													className={classNames(
														item.current
															? "bg-[#0a401f] text-white"
															: "text-white hover:bg-mid-green hover:text-white",
														"block px-3 py-2 rounded-md text-base font-medium"
													)}
													aria-current={
														item.current
															? "page"
															: undefined
													}
												>
													{item.name}
												</Disclosure.Button>
											))}
										</div>
										<div className="border-t border-light-green pt-4 pb-3">
											<div className="flex items-center px-5">
												<div className="flex-shrink-0">
													<Image
														className="h-10 w-10 rounded-full"
														height={40}
														width={40}
														src={user.imageUrl}
														alt=""
													/>
												</div>
												<div className="ml-3">
													<div className="text-base font-medium leading-none text-white">
														{user.name}
													</div>
													<div className="text-sm font-medium leading-none text-gray-300">
														{user.email}
													</div>
												</div>
												<button
													type="button"
													className="ml-auto flex-shrink-0 rounded-full bg-dark-green p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
												>
													<span className="sr-only">
														View notifications
													</span>
													<BellIcon />
												</button>
											</div>
											<div className="mt-3 space-y-1 px-2">
												{userNavigation.map((item) => (
													<Disclosure.Button
														key={item.name}
														as="a"
														href={item.href}
														className="block rounded-md px-3 py-2 text-base font-medium text-gray-100 hover:bg-light-green hover:text-white"
													>
														{item.name}
													</Disclosure.Button>
												))}
											</div>
										</div>
									</Disclosure.Panel>
								</>
							)}
						</Disclosure>
						<header className="py-10">
							<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
								<h1 className="text-3xl font-normal tracking-tight text-white font-Poppins">
									Welcome back,{" "}
									<b className="font-semibold">
										{" "}
										{account?.name}{" "}
									</b>
								</h1>
							</div>
						</header>
					</div>

					<main className="-mt-32 min-h-fit mb-12">
						<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-fit">
							<div className="rounded-lg bg-white px-5 py-6 shadow-lg sm:px-6">
								<div className="min-h-fit pb-6">
									<div className="flex flex-row items-center">
										<h2 className="font-Lato text-2xl">
											Recent Activity
										</h2>
										<div className="grow h-1 bg-gray-100 mx-4"></div>
									</div>
									{/* Card */}
									{recent.length !== 0 ? (
										<>
											<div className="mt-5 min-h-fit grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
												{recent.map((item, index) => (
													<Link
														key={index}
														href={`/${
															item.term
																? "term"
																: "degree"
														}/${item.id}`}
													>
														<div
															className="rounded-lg cursor-pointer group"
															key={index}
														>
															<div className="bg-transparent text-white group-hover:shadow-2xl text-center font-Poppins font-semibold flex justify-start">
																<p
																	className="w-fit p-2 px-3 rounded-t ml-2 shadow"
																	style={{
																		backgroundColor:
																			item.term
																				? "#164e63"
																				: "#000",
																		color: item.term
																			? "#cffafe"
																			: "#fff",
																	}}
																>
																	{item.term
																		? item.term
																		: "Degree"}
																</p>
															</div>
															<div className="shadow-lg group-hover:shadow-xl">
																<div className="p-5 rounded-t bg-sse">
																	{/* <div className="flex items-center">
																		<div className="w-0 flex-1 flex flex-row items-center justify-center text-2xl font-extrabold">
																			<p className="bg-white p-2 px-4 font-bold font-JetBrainsMono w-fit rounded text-sse">
																				{
																					item.major
																				}
																			</p>
																			<p className="font-extrabold mx-5 text-white">
																				/
																			</p>
																			<p className="bg-cyan-900 p-2 px-4 font-bold font-JetBrainsMono w-fit rounded text-yellow-500">
																				{
																					item.minor.split(
																						"/"
																					)[1]
																				}
																			</p>
																		</div>
																	</div> */}
																	<div className="flex flex-row justify-center items-center select-none max-w-xs bg-white rounded">
																		{/* <div className="flex flex-row justify-start items-center bg-white align-middle h-fit rounded my-auto mx-auto"> */}
																		<p className="font-JetBrainsMono font-extrabold px-2 py-2 rounded text-2xl text-sse">
																			{
																				item.major
																			}
																		</p>
																		{/* </div> */}
																		<p className="font-extrabold text-green-pea">
																			-
																		</p>
																		{/* <div className="flex flex-row justify-start items-center bg-cyan-900 align-middle h-fit rounded my-auto mx-auto"> */}
																		<p className="font-JetBrainsMono font-extrabold px-2 py-2 rounded text-2xl text-sse">
																			{
																				item.minor.split(
																					"/"
																				)[1]
																			}
																		</p>
																		{/* </div> */}
																	</div>
																</div>
																<div className="bg-green-pea rounded-b border-0 -mt-[0.2px] border-green-pea border-t-0">
																	<div className="text-sm rounded-b w-full h-full px-5 py-3 bg-[#eec5fa]">
																		<p className="text-sse font-Lato">
																			<span className="font-extrabold text-sse">
																				<span
																					className="text-red-500 font-semibold"
																					style={{
																						color: !item.count
																							? "#ef4444"
																							: "#61366E",
																					}}
																				>
																					{
																						item.count
																					}
																				</span>{" "}
																				{"courses" in
																				item
																					? ` / ${item.courses}`
																					: ""}
																			</span>{" "}
																			{}
																			courses
																			planned
																		</p>
																	</div>
																</div>
															</div>
														</div>
													</Link>
												))}
											</div>
											{/* View more button */}
											{/* <div className="flex justify-center mt-5">
                                                <button className="font-Lato text-cyan-700 bg-white hover:bg-gray-100 transition-colors rounded px-2 py-2 font-semibold w-1/3">
                                                    Load More
                                                </button>
                                            </div> */}
										</>
									) : (
										<div></div>
									)}
									{/* {
                                            degrees.slice(3).map((degree) => {
                                                // degree.
                                                return (
                                                    <div className="rounded-lg cursor-pointer group">
                                                        <div className="bg-transparent text-white group-hover:shadow-2xl text-center font-Poppins font-semibold flex justify-start">
                                                            <p
                                                                className="bg-gray-900 w-fit p-2 px-3 rounded-t ml-2 shadow"
                                                                style={{
                                                                    background: degree.type === "Degree" ? "rgb(17 24 39 / 1)" : "rgb(17 24 39 / 0.5)",
                                                                }}
                                                            >
                                                                {degree.type}
                                                            </p>
                                                        </div>
                                                        <div className="shadow-lg group-hover:shadow-xl">
                                                            <div className="p-5 rounded-t bg-cyan-700">
                                                                <div className="flex items-center">
                                                                    <div className="w-0 flex-1 flex flex-row items-center justify-center text-2xl font-extrabold">
                                                                        <p className="bg-white p-2 px-4 font-bold font-JetBrainsMono w-fit rounded text-cyan-900">
                                                                            BSCSC
                                                                        </p>
                                                                        <p className="font-extrabold mx-5 text-white">
                                                                            /
                                                                        </p>
                                                                        <p className="bg-cyan-900 p-2 px-4 font-bold font-JetBrainsMono w-fit rounded text-yellow-500">
                                                                            BA
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="bg-cyan-700 rounded-b border-0 -mt-[0.2px] border-cyan-700 border-t-0">
                                                                <div className="text-sm rounded-b w-full h-full px-5 py-3 bg-cyan-50">
                                                                    <p className="text-cyan-700 font-Lato">
                                                                        <span className="font-extrabold text-cyan-700">
                                                                            <span className="text-red-500 font-semibold">21</span> / 43
                                                                        </span>{" "}
                                                                        courses planned
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            });
                                        } */}
								</div>
								<div className="min-h-fit pb-6">
									<div className="flex flex-row items-center">
										<h2 className="font-Lato text-2xl">
											Your Degree Plans
										</h2>
										<div className="grow h-1 bg-gray-100 mx-4"></div>
										{/* <button className="font-Lato text-cyan-700 font-semibold">
                                            View All
                                        </button> */}
										<button
											onClick={() => setOpen(true)}
											className="font-Lato text-white bg-green-pea rounded px-2 py-2 font-semibold"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 mr-1 inline-block"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10 3a1 1 0 00-1 1v4H5a1 1 0 100 2h4v4a1 1 0 102 0v-4h4a1 1 0 100-2h-4V4a1 1 0 00-1-1z"
													clipRule="evenodd"
												/>
											</svg>
											Add New
										</button>
									</div>
									{/* Card */}
									{degrees.length !== 0 ? (
										<div className="mt-5 min-h-fit grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
											{degrees.map((degree, index) => {
												return (
													<Link
														href={`/degree/${degree.id}`}
														passHref
														key={index}
													>
														<div
															className="rounded-lg cursor-pointer group"
															key={index}
														>
															<div className="bg-transparent text-white group-hover:shadow-2xl text-center font-Poppins font-semibold flex justify-start">
																<p className="bg-gray-900 w-fit p-2 px-3 rounded-t ml-2 shadow">
																	Degree
																</p>
															</div>
															<div className="shadow-lg group-hover:shadow-xl">
																<div className="p-5 rounded-t bg-sse">
																	{/* <div className="flex items-center">
																		<div className="w-0 flex-1 flex flex-row items-center justify-center text-2xl font-extrabold">
																			<p className="bg-white p-2 px-4 font-bold font-JetBrainsMono w-fit rounded text-cyan-900">
																				{
																					degree.major
																				}
																			</p>
																			<p className="font-extrabold mx-5 text-white">
																				/
																			</p>
																			<p className="bg-cyan-900 p-2 px-4 font-bold font-JetBrainsMono w-fit rounded text-yellow-500">
																				{
																					degree.minor.split(
																						"/"
																					)[1]
																				}
																			</p>
																		</div>
																	</div> */}
																	<div className="flex flex-row justify-center items-center select-none max-w-xs bg-white rounded">
																		{/* <div className="flex flex-row justify-start items-center bg-white align-middle h-fit rounded my-auto mx-auto"> */}
																		<p className="font-JetBrainsMono font-extrabold px-2 py-2 rounded text-2xl text-sse">
																			{
																				degree.major
																			}
																		</p>
																		{/* </div> */}
																		<p className="font-extrabold text-green-pea">
																			-
																		</p>
																		{/* <div className="flex flex-row justify-start items-center bg-cyan-900 align-middle h-fit rounded my-auto mx-auto"> */}
																		<p className="font-JetBrainsMono font-extrabold px-2 py-2 rounded text-2xl text-sse">
																			{
																				degree.minor.split(
																					"/"
																				)[1]
																			}
																		</p>
																		{/* </div> */}
																	</div>
																</div>
																<div className="bg-green-pea rounded-b border-0 -mt-[0.2px] border-green-pea border-t-0">
																	<div className="text-sm rounded-b w-full h-full px-5 py-3 bg-[#eec5fa]">
																		<p className="text-sse font-Lato">
																			<span className="font-extrabold text-sse">
																				<span className="text-red-500 font-semibold">
																					{
																						degree.count
																					}
																				</span>{" "}
																				/{" "}
																				{
																					degree.courses
																				}
																			</span>{" "}
																			courses
																			planned
																		</p>
																	</div>
																</div>
															</div>
														</div>
													</Link>
												);
											})}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center pt-6">
											{/* sad emoji svg */}
											<p className="font-Lato text-gray-700 font-light text-xl mt-5">
												You have no degree plans yet...
											</p>
											<button className="font-Lato text-white bg-green-pea rounded px-2 py-2 font-semibold mt-5">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5 mr-1 inline-block"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M10 3a1 1 0 00-1 1v4H5a1 1 0 100 2h4v4a1 1 0 102 0v-4h4a1 1 0 100-2h-4V4a1 1 0 00-1-1z"
														clipRule="evenodd"
													/>
												</svg>
												Get Started
											</button>
										</div>
									)}
									{/* </div> */}
									{/* <div className="flex justify-center mt-5">
                                        <button className="font-Lato text-cyan-700 bg-gray-100 hover:bg-cyan-700 hover:text-white transition-colors rounded px-2 py-2 font-semibold w-3/5">
                                            Load More
                                        </button>
                                    </div> */}
								</div>
								<div className="min-h-fit">
									<div className="flex flex-row items-center">
										<h2 className="font-Lato text-2xl">
											Single Term Plans
										</h2>
										<div className="grow h-1 bg-gray-100 mx-4"></div>
										{/* <button className="font-Lato text-cyan-700 font-semibold">
                                            View All
                                        </button> */}
										<button
											disabled
											className="font-Lato opacity-60 cursor-not-allowed text-white bg-green-pea rounded px-2 py-2 font-semibold"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 mr-1 inline-block"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10 3a1 1 0 00-1 1v4H5a1 1 0 100 2h4v4a1 1 0 102 0v-4h4a1 1 0 100-2h-4V4a1 1 0 00-1-1z"
													clipRule="evenodd"
												/>
											</svg>
											Add New
										</button>
									</div>
									{/* Card */}
									{singles.length !== 0 ? (
										<div className="mt-5 min-h-fit grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
											{singles.map((single, index) => {
												return (
													<Link
														key={index}
														href={`/term/${single.id}`}
														passHref
													>
														<div className="rounded-lg cursor-pointer group">
															<div className="bg-white text-white text-center group-hover:shadow-xl font-Poppins font-semibold flex justify-start">
																<p className="bg-sse w-fit p-2 px-3 rounded-t ml-2 shadow">
																	{
																		single.term
																	}
																</p>
															</div>
															<div className="shadow-lg group-hover:shadow-xl">
																<div className="p-5 rounded-t bg-sse shadow-md">
																	{/* <div className="flex items-center">
																		<div className="w-0 flex-1 flex flex-row items-center justify-center text-2xl font-extrabold">
																			<p className="bg-white p-2 px-4 font-bold font-JetBrainsMono w-fit rounded text-cyan-900">
																				{
																					single.major
																				}
																			</p>
																			<p className="font-extrabold mx-5 text-white">
																				/
																			</p>
																			<p className="bg-cyan-900 p-2 px-4 font-bold font-JetBrainsMono w-fit rounded text-yellow-500">
																				{
																					single.minor.split(
																						"/"
																					)[1]
																				}
																			</p>
																		</div>
																	</div> */}
																	<div className="flex flex-row justify-center items-center select-none max-w-xs bg-white rounded">
																		{/* <div className="flex flex-row justify-start items-center bg-white align-middle h-fit rounded my-auto mx-auto"> */}
																		<p className="font-JetBrainsMono font-extrabold px-2 py-2 rounded text-2xl text-sse">
																			{
																				single.major
																			}
																		</p>
																		{/* </div> */}
																		<p className="font-extrabold text-green-pea">
																			-
																		</p>
																		{/* <div className="flex flex-row justify-start items-center bg-cyan-900 align-middle h-fit rounded my-auto mx-auto"> */}
																		<p className="font-JetBrainsMono font-extrabold px-2 py-2 rounded text-2xl text-sse">
																			{
																				single.minor.split(
																					"/"
																				)[1]
																			}
																		</p>
																		{/* </div> */}
																	</div>
																</div>
																<div className="bg-green-pea rounded-b border-0 -mt-[0.2px] border-green-pea border-t-0">
																	<div className="text-sm w-full h-full px-5 py-3 bg-[#eec5fa] rounded-b">
																		<p className="text-sse">
																			<span className="font-bold text-gray-900">
																				<span className="text-sse font-extrabold">
																					{
																						single.count
																					}
																				</span>
																			</span>{" "}
																			courses
																		</p>
																	</div>
																</div>
															</div>
														</div>
													</Link>
												);
											})}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center py-6">
											{/* sad emoji svg */}
											<p className="font-Lato text-gray-700 font-light text-lg select-none mt-5">
												You have no single term plans
												yet...
											</p>
											<button
												disabled
												className="font-Lato opacity-60 cursor-not-allowed text-white bg-green-pea rounded px-2 py-2 font-semibold mt-5"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5 mr-1 inline-block"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M10 3a1 1 0 00-1 1v4H5a1 1 0 100 2h4v4a1 1 0 102 0v-4h4a1 1 0 100-2h-4V4a1 1 0 00-1-1z"
														clipRule="evenodd"
													/>
												</svg>
												Get Started
											</button>
										</div>
									)}
								</div>
								{/* <div className="flex justify-center mt-5">
                                        <button className="font-Lato text-cyan-700 bg-gray-100 hover:bg-cyan-700 hover:text-white transition-colors rounded px-2 py-2 font-semibold w-3/5">
                                            Load More
                                        </button>
                                    </div> */}
							</div>
						</div>
						<Transition appear show={open} as={Fragment}>
							<Dialog
								as="div"
								className="relative z-10"
								onClose={() => setOpen(false)}
							>
								<Transition.Child
									as={Fragment}
									enter="ease-out duration-300"
									enterFrom="opacity-0"
									enterTo="opacity-100"
									leave="ease-in duration-200"
									leaveFrom="opacity-100"
									leaveTo="opacity-0"
								>
									<div className="fixed inset-0 bg-black bg-opacity-25" />
								</Transition.Child>

								<div className="fixed inset-0 overflow-y-auto">
									<div className="flex min-h-full items-center justify-center p-4 text-center">
										<Transition.Child
											as={Fragment}
											enter="ease-out duration-300"
											enterFrom="opacity-0 scale-95"
											enterTo="opacity-100 scale-100"
											leave="ease-in duration-200"
											leaveFrom="opacity-100 scale-100"
											leaveTo="opacity-0 scale-95"
										>
											<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white pb-6 text-left align-middle shadow-xl transition-all">
												<Dialog.Title
													as="h3"
													className="text-xl font-bold leading-6 text-white font-Poppins bg-green-pea p-3"
												>
													New Degree
												</Dialog.Title>
												<div className="mt-2 px-2">
													<p className="text-sm text-gray-500">
														Create a new degree
														plan:
													</p>
												</div>
												<div className="mt-4 px-2">
													<label className="block text-sm font-medium text-gray-700">
														Major
													</label>
													<CBox
														options={mjrs}
														selected={mjr}
														setSelected={setMajor}
													/>
												</div>
												<div className="mt-4 px-2">
													<label className="block text-sm font-medium text-gray-700">
														Minor
													</label>
													<CBox
														options={minors}
														selected={minor}
														setSelected={setMinor}
													/>
												</div>

												<div className="mt-4 px-2">
													<button
														type="button"
														className="inline-flex justify-center rounded-md border border-transparent bg-light-green px-4 py-2 text-sm font-medium text-green-pea hover:bg-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-mid-green focus-visible:ring-offset-2"
														onClick={() => {
															setOpen(false);
															handleAddDegree();
														}}
													>
														Add
													</button>
												</div>
											</Dialog.Panel>
										</Transition.Child>
									</div>
								</div>
							</Dialog>
						</Transition>
					</main>
				</div>
			</div>
		</>
	);
};

export default Dashboard;
