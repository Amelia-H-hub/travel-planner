import { type ReactNode } from "react";

interface FormPageProp {
  backgroundImage: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function FormPageLayout({
  backgroundImage,
  title,
  subtitle,
  children
}: FormPageProp) {
  return (
    <div className="relative min-h-screen w-full">
      <div className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0" style={{ backgroundImage: `url(${backgroundImage})`}}></div>
      <div className="fixed inset-0 bg-black/35 z-0"></div>
      <div className="relative z-10 pb-24 pt-30 md:py-24 px-6 md:px-12 lg:px-20 min-h-screen flex flex-col justify-center">
        <div className="mb-5">
          <h1 className="text-white text-3xl md:text-5xl font-black drop-shadow-lg mb-4 text-center">
            {title}
          </h1>
          <p className="text-white/80 text-lg mb-8 font-light tracking-wide text-center">
            {subtitle}
          </p>
        </div>
        <div className="bg-[#F0F0F0]/60 py-8 md:py-10 px-6 md:px-16 rounded-2xl shadow-3xl backdrop-blur-md">
          {children}
        </div>
      </div>
    </div>
  )
}