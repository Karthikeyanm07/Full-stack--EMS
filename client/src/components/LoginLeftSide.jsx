import React from "react";

const LoginLeftSide = () => {
	return (
		<div
			className="hidden md:flex w-1/2 bg-indigo-950 relative 
            overflow-hidden border-r border-slate-200"
		>
			{/* Landing page blur effect */}
			<div
				className="absolute -top-30 -left-30 size-72 
                bg-indigo-500/20 rounded-full blur-3xl"
			/>
			<div
				className="relative z-10 flex flex-col items-start 
                justify-center p-12 lg:-20 w-full h-full"
			>
				<h1 className="text-4xl lg:text-5xl font-medium text-white leading-tight tracking-tight">
					Employee
					<br /> Management System
				</h1>
				<p className="text-slate-400 text-lg max-w-md leading-relaxed">
					Streamline your workforce operations track attendance,
					manage payroll, and empower your team securely.
				</p>
			</div>
		</div>
	);
};

export default LoginLeftSide;
