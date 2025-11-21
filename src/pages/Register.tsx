import { Controller, useForm } from "react-hook-form"
import Flatpickr from 'react-flatpickr';
import "flatpickr/dist/themes/airbnb.css";
import { useLoginModal } from "../context/LoginModalContext";
import { useNavigate } from "react-router-dom";
import { validatePassword, validateConfirmPassword } from "../utils/validation";
import { toast } from "sonner"

export default function Register() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const { openLoginModal } = useLoginModal();
  const { control, handleSubmit, getValues } = useForm({
    defaultValues: {
      userName: "",
      birthday: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
    mode: "onBlur"
  })
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const onSubmit =  async (data: any) => {
    const req = {
      user_name: data.userName,
      birthday: formatDate(data.birthday[0]),
      email: data.email,
      password: data.password
    };
    console.log(req);

    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(req)
    })
    const result = await res.json();

    if(result.code === 0) {
      toast.success(result.message, {
        action: {
          label: "Back to home",
          onClick: () => navigate('/'),
        },
      })
    } else {
      alert(`Registration failed: ${result.error}`);
    }
  }

  const onError = (errors: any) => {
    console.error('❌ Form validation errors:', errors);
  };

  return (
    <div className="before:absolute before:inset-0 before:bg-[#eff5ff] before:-z-10">
      <div className="flex justify-center bg-transparent py-4">
        <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col gap-6 px-16 py-10 w-3/4 bg-white rounded-2xl">
          <h3 className="text-4xl font-bold text-[#1f3255]">
            Create Your Account
          </h3>
          {/* userName */}
          <div className="flex flex-col gap-2 items-start">
            <label htmlFor="userName" className="text-xl font-bold text-black">
              Name
            </label>
            <Controller
              control={control}
              name="userName"
              rules={{ required: "Name is required" }}
              render={({field, fieldState}) => (
                <div className="w-full">
                  <input
                    {...field}
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 focus:outline-none border-solid border-1 border-gray-500 rounded-lg text-gray-500"
                  />
                  {fieldState.error && (
                    <p className="w-full text-red-500 text-left mt-1">{fieldState.error.message}</p>
                  )}
                </div>                
              )}
            >
            </Controller>
          </div>
          <div className="flex flex-col gap-2 items-start">
            <label htmlFor="birthday" className="text-xl font-bold text-black">
              Birthday
            </label>
            <Controller
              control={control}
              name="birthday"
              rules={{ required: "Birthday is required" }}
              render = {({field, fieldState}) => {
                const { onChange, onBlur, value, ref } = field;
                return (
                  <div className="w-full">
                    <Flatpickr
                      id="birthday"
                      options={{
                        dateFormat: "Y-m-d",
                        closeOnSelect: false,
                      }}
                      value={value}
                      onClose={(selectedDates) => {
                        onChange(selectedDates);
                      }}
                      onBlur={onBlur}
                      placeholder="YYYY-MM-DD"
                      className="w-full px-4 py-2 border-solid border-1 border-gray-500 text-gray-500 rounded-lg"
                      ref={ref}
                    />
                    {fieldState.error && (
                      <p className="w-full text-red-500 text-left mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )
              }}
            >
            </Controller>
          </div>
          {/* Email */}
          <div className="flex flex-col gap-2 items-start">
            <label htmlFor="email" className="text-xl font-bold text-black">
              Email
            </label>
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
                    className="w-full px-4 py-2 focus:outline-none border-solid border-1 border-gray-500 rounded-lg text-gray-500"
                  />
                  {fieldState.error && (
                    <p className="w-full text-red-500 text-left mt-1">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            >
            </Controller>
          </div>
          {/* Password */}
          <div className="flex flex-col gap-2 items-start">
            <label htmlFor="password" className="text-xl font-bold text-black">
              Password
            </label>
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long"
                },
                validate: validatePassword
              }}
              render={({field, fieldState}) => (
                <div className="w-full">
                    <input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 focus:outline-none border-solid border-1 border-gray-500 rounded-lg text-gray-500"
                  />
                  {fieldState.error && (
                    <p className="w-full text-red-500 text-left mt-1">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            >
            </Controller>
          </div>
          {/* Confirm Password */}
          <div className="flex flex-col gap-2 items-start">
            <label htmlFor="confirmPassword" className="text-xl font-bold text-black">
              Confirm Your Password
            </label>
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: "Please enter your password again",
                validate: (value) => validateConfirmPassword(value, getValues("password"))
              }}
              render={({field, fieldState}) => (
                <div className="w-full">
                  <input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    className="w-full px-4 py-2 focus:outline-none border-solid border-1 border-gray-500 rounded-lg text-gray-500"
                  />
                  {fieldState.error && (
                    <p className="w-full text-red-500 text-left mt-1">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            >
            </Controller>
          </div>
          <div className="flex flex-col justify-center items-center gap-4 w-full">
            <button className="flex justify-center items-center bg-[#2096a8] hover:bg-[#4fa2b1] !border-0 w-full text-white px-6 py-5 rounded-lg">
              Sign Up
            </button>
            <p
              onClick={openLoginModal}
              className="text-center text-base text-[#1f3255] hover:text-[#4fa2b1] hover:underline cursor-pointer active:scale-95 transition"
            >
              Already registered? Login
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}