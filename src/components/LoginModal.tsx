import { useAuth } from "@/context/AuthContext";
import navIcon from "../assets/navIcon.png";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { control, handleSubmit, getValues, reset } = useForm({
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onBlur"
  });
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const onSubmit = async (data: any) => {
    const req = {
      email: data.email,
      password: data.password
    };

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      credentials: "include" // make cookie be stored
    });
    const result = await res.json();

    if (200 <= result.code && result.code < 300) {
      const userRes = await fetch(`${API_BASE_URL}/api/auth/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      const userData = await userRes.json();
      setUser(userData.data);

      toast.success(result.message);
      onClose();
    } else if (400 <= result.code && result.code < 600) {
      toast.error(result.message);
    }
  }

  const onError = (errors: any) => {
    console.error('❌ Form validation errors:', errors);
  };

  const register = () => {
    const value = getValues(); // get current form values

    reset();
    onClose();
    navigate('/register', {
      state: {
        email: value.email,
      }
    });
  }

  return (
    <div className="fixed insert-0 bg-black/40 size-full flex justify-center items-center z-50">
      <div className="flex flex-col justify-center items-center px-6 pt-4 pb-14 w-1/4 bg-white rounded-2xl shadow-xl">
        <div className="flex justify-end w-full mb-4">
          <button
            onClick={onClose}
            className="bg-transparent text-gray-500 text-2xl"
          >
            X
          </button>
        </div>
        <div className="flex flex-wrap justify-center items-center px-8 mb-12">
          <img src={navIcon} alt="icon" className="w-2/5 object-contain"></img>
          <p className="w-full text-3xl font-bold text-[#1f3255]"> Welcome to Journi! </p>
          <p className="w-full text-lg text-gray-500"> Your personal travel planner </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="w-full">
          <div className="w-full flex flex-col gap-4 px-8 mb-14">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="w-full flex justify-start text-base text-black px-2"> Email </label>
              <Controller
                control={control}
                name="email"
                rules={{ required: "Email is required" }}
                render={({field, fieldState}) => (
                  <div className="w-full">
                    <input
                      {...field}
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      className="w-full px-4 py-2 focus:outline-none border-solid border-1 border-gray-500 rounded-lg text-gray-500">
                    </input>
                    {fieldState.error && (
                      <p className="w-full text-red-500 text-left mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                  )
                }
              >
              </Controller>
              
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="w-full flex justify-start text-base text-black px-2"> Password </label>
              <Controller
                control={control}
                name="password"
                rules={{ required: "Password is required" }}
                render={({field, fieldState}) => (
                  <div>
                    <input
                      {...field}
                      type="password"
                      autoComplete="current-password"
                      placeholder="Emter your Password"
                      className="w-full px-4 py-2 focus:outline-none border-solid border-1 border-gray-500 rounded-lg text-gray-500">
                    </input>
                    {fieldState.error && (
                      <p className="w-full text-red-500 text-left mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                  )
                }
              >
              </Controller>
              
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-4 w-full px-6">
            <p
              onClick={register}
              className="w-full text-center text-base text-[#1f3255] hover:text-[#4fa2b1] hover:underline cursor-pointer active:scale-95 transition"
            >
              Don't have a account? Click here to register!
            </p>
            <button className="flex justify-center items-center bg-[#2096a8] hover:bg-[#4fa2b1] !border-0 w-full text-white px-6 py-5 rounded-lg">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}