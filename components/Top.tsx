import Image from "next/image";
import { useCourses } from "../hooks/useCourses";
import Link from "next/link";

const Top = () => {
	const { majorMinor } = useCourses();
	return (
		<div className="text-white text-2xl absolute top-0 h-16 bg-green-pea w-full border-b-[0.1px] border-white/20 shadow-lg z-20 grid grid-cols-3 grid-rows-1">
			{/* <div className="text-white text-2xl absolute top-0 h-16 bg-cyan-700 brightness-110 w-full border-b border-sky-300/20 shadow-lg z-20 grid grid-cols-3 grid-rows-1"> */}
			<div className="px-4 py-2 rounded ml-2 flex justify-start items-center">
				<Link href="/dashboard" passHref>
					<div className="select-none cursor-pointer">
						<span className="pr-[0.125rem] font- text-2xl font-Raleway">
							my
						</span>
						<span className="text-white bg-black p-1 px-2 rounded font-bold font-JetBrainsMono">
							Degree
						</span>
					</div>
				</Link>
			</div>
			<div className="w-full flex justify-center items-center">
				<div className="flex flex-row justify-center items-center select-none max-w-xs bg-white rounded">
					{/* <div className="flex flex-row justify-start items-center bg-white align-middle h-fit rounded my-auto mx-auto"> */}
					<p className="font-JetBrainsMono font-extrabold px-4 py-2 rounded text-2xl text-green-pea">
						{majorMinor.major}
					</p>
					{/* </div> */}
					<p className="font-extrabold text-green-pea mx-5">/</p>
					{/* <div className="flex flex-row justify-start items-center bg-cyan-900 align-middle h-fit rounded my-auto mx-auto"> */}
					<p className="font-JetBrainsMono font-extrabold px-4 py-2 rounded text-2xl text-green-pea">
						{majorMinor.minor.split("/")[1]}
					</p>
					{/* </div> */}
				</div>
			</div>
			<div className="flex justify-end items-center mr-4">
				<div className="w-fit">
					<Image
						src={"https://avatars.dicebear.com/api/micah/4.svg"}
						width={40}
						height={40}
						alt={""}
						className="rounded-full bg-white "
					/>
				</div>
			</div>
		</div>
	);
};

export default Top;
