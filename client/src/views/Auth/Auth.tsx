import { useState, FormEvent } from "react";
import axios from "axios";
import "./Auth.css";
import logo from "../../assets/quickchat.png";

interface AuthProps {
	onAuth: (token: string, userId: string) => void;
}

const Auth = ({ onAuth }: AuthProps) => {
	const [isLogin, setIsLogin] = useState(true);
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		const endpoint = isLogin ? "/auth/login" : "/auth/register";

		try {
      setIsLoading(true);
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}${endpoint}`,
				{
					id: username,
					...(isLogin ? {} : { name: displayName || username }),
				},
			);
      onAuth(response.data.stream_token, response.data.user_id);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.detail ||
				error.message ||
				"Authentication failed";
			setError(errorMessage);
		} finally {
      setIsLoading(false);
    }
	};

	return (
		<>
			<div id="auth" className="flex flex-col flex-1 items-center justify-center my-[4.5rem] md:my-14">
				<div id="bg" className="w-full h-[200px] absolute top-11"></div>
				<section className="flex flex-col mx-5 gap-14 max-w-sm md:mx-auto">
					<div className="flex flex-col gap-3">
						<img src={logo} className="max-h-40 object-cover" />
						<h1 className="text-white font-medium selection:bg-green selection:text-black text-[2.375rem] w-5/6 md:w-full md:text-5xl md:font-semibold md:leading-tight">
							Connect Fast, Chat Faster.
						</h1>
					</div>

					<form
						className="flex flex-col gap-8 selection:bg-green selection:text-black"
						onSubmit={handleSubmit}
					>
						<div className="flex flex-col gap-8">
							<div className="flex flex-col gap-2">
								<label htmlFor="username" className="text-sm">
									Username
								</label>
								<input
									id="username"
									className="rounded-md text-white py-3 md:py-4 px-4 focus-visible:outline-green placeholder:opacity-20 md:placeholder:text-lg"
									type="username"
									required
									placeholder="Enter username"
									onChange={(e) => setUsername(e.target.value)}
								/>
							</div>
							{!isLogin && (
								<div className="flex flex-col gap-2">
									<label htmlFor="name" className="text-sm">
										Display Name (optional)
									</label>
									<input
										id="name"
										className="rounded-md text-white py-3 md:py-4 px-4 focus-visible:outline-green placeholder:opacity-20 md:placeholder:text-lg"
										type="text"
										required
										placeholder="Enter name"
										onChange={(e) => setDisplayName(e.target.value)}
									/>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-2">
							<button
								className="focus-visible:outline-white rounded-md text-white border-green w-full py-3 cursor-pointer disabled:cursor-not-allowed disabled:opacity-20"
								aria-live="polite"
								disabled={isLoading || !username}
							>
								<span>{isLogin ? "Login" : "Register"}</span>
							</button>
						</div>

						<button
							className="flex items-center justify-center cursor-pointer"
							type="button"
							onClick={() => {
								setIsLogin(!isLogin);
								setError("");
							}}
						>
							<span
								className="text-[#8E8E8E]"
								style={{ WebkitTextFillColor: "currentcolor" }}
							>
								{isLogin ? "Start " : "Continue "}
								Your Chatting Journey by
							</span>
							<span className="text-white font-bold ml-1">
								{isLogin ? "Signing Up!" : "Signing In!"}
							</span>
						</button>
					</form>
					{error && (
						<div className="flex flex-col">
							<hr className="border-t-green" />
							<div className="flex flex-col text-red-500">
								<p>{error}</p>
							</div>
						</div>
					)}
				</section>
			</div>
		</>
	);
};

export default Auth;
