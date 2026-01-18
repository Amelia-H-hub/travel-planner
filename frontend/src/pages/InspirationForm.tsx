import inspirationBg from '../assets/inspiration_bg.jpg';
import { Controller, useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import countryList from 'react-select-country-list';
import "flatpickr/dist/themes/airbnb.css";
import AutoComplete from '../components/AutoComplete';
import PersonSelector from '../components/PersonSelector';
import { ArrowBigRightDash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/constants';


export default function InspirationForm() {

  // Define the form
  const { control, handleSubmit} = useForm({
    defaultValues: {
      age: "",
      gender: "",
      nationality: "",
      region: "all",
      companion: {
        babies: 0,
        children: 0,
        adults: 0,
        seniors: 0
      },
      budget: ""
    }
  });

  // Gender dropdown options
  const genderOptions = [
    {label: "Female", value: "Female"},
    {label: "Male", value: "Male"},
    {label: "Other", value: "Other"}
  ];

  // All country options
  const allCountries = useMemo(() => countryList().getData(), []);
  // Filter country options
  const searchCountries = async (input: string) => {
    return allCountries.filter((country: { label: string; value: string}) =>
      country.label.toLowerCase().includes(input.toLowerCase())
    );
  };
  // Display selected country name
  const onCountrySelect = (item: any) => {
    return item.label;
  };

  // Region dropdown options
  const regionOptions = [
    { label: "Global", value: "all" },
    { label: "Africa", value: "africa" },
    { label: "Asia", value: "asia" },
    { label: "Europe", value: "europe" },
    { label: "Middle East", value: "middle_east" },
    { label: "North America", value: "north_america" },
    { label: "Oceania", value: "oceania" },
    { label: "South America", value: "south_america" }
  ]

  // Budget dropdown options
  const budgetOptions = [
    {label: "Low", value: "Low"},
    {label: "Medium", value: "Medium"},
    {label: "High", value: "High"},
  ]

  const navigate = useNavigate();

  const onSubmit =  async (data: any) => {
    navigate('/citiesRecommendation', {
      state: {
        age: data.age,
        gender: data.gender,
        nationality: data.nationality,
        region: data.region,
        companion: data.companion,
        budget: data.budget
      }
    });
  };

  const onError = (errors: any) => {
    console.error('❌ Form validation errors:', errors);
  };

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 w-full min-h-screen object-cover bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${inspirationBg})`}}></div>
      <div className="absolute inset-0 bg-black/35"></div>
      <div className="relative z-10 top-50 px-20">
        <h1 className="text-white text-[48px] font-black drop-shadow-lg mb-2">
          Where to Next?
        </h1>
        <p className="text-white/80 text-lg mb-8 font-light tracking-wide">
          Tell us a bit about yourself, and our AI will curate the perfect vibe for your next trip.
        </p>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-[#F0F0F0]/60 py-10 px-16 rounded-2xl shadow-3xl backdrop-blur-md">
          <div className="w-full">
            <h3 className="text-left text-xl font-bold text-[#020f14] underline mb-3">
              Your Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-wrap justify-start">
                <label htmlFor="age" className="w-full mb-1 text-left text-[#020f14]">
                  Age
                </label>
                <Controller
                  control={control}
                  name="age"
                  rules={{ required: true }}
                  render={({field, fieldState}) => (
                    <div className="w-full">
                      <input
                        {...field}
                        type="number"
                        autoComplete="age"
                        placeholder="Enter your age"
                        className="w-full px-4 py-5 focus:outline-none bg-white border-solid border-1 border-gray-500 rounded-lg text-gray-500"
                      />
                      {fieldState.error && (
                        <p className="w-full text-red-500 text-left mt-1">{fieldState.error.message}</p>
                      )}
                    </div>                
                  )}
                />
              </div>
              <div className="flex flex-wrap justify-start">
                <label htmlFor="gender" className="w-full mb-1 text-left text-[#020f14]">
                  Gender
                </label>
                <Controller
                  control={control}
                  name="gender"
                  rules={{ required: true }}
                  render={({field, fieldState}) => (
                    <div className="w-full">
                      <select
                        {...field}
                        className="w-full px-4 py-5 focus:outline-none border-solid border-1 border-gray-500 rounded-lg text-gray-500 bg-white"
                      >
                        <option value="" disabled>Select Gender</option>
                        {genderOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {fieldState.error && (
                        <p className="text-red-500 text-left mt-1 text-sm">{fieldState.error.message}</p>
                      )}
                    </div>               
                  )}
                />
              </div>
              <div className="flex flex-wrap justify-start">
                <label htmlFor="nationality" className="w-full mb-1 text-left text-[#020f14]">
                  Nationality
                </label>
                <Controller
                  control={control}
                  name="nationality"
                  rules={{ required: true }}
                  render={({field, fieldState}) => (
                    <div className="w-full">
                      <AutoComplete
                        {...field}
                        placeholder="Search your home country"
                        onSearch={searchCountries}
                        onSelect={onCountrySelect}
                        displayFormat={(item: any) => item.label}
                      ></AutoComplete>
                      {fieldState.error && (
                        <p className="text-red-500 text-left mt-1 text-sm">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="w-full mt-6">
            <h3 className="text-left text-xl font-bold text-[#020f14] underline mb-3">
              Trip Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-wrap justify-start">
                <label htmlFor="region" className="w-full mb-1 text-left text-[#020f14]">
                  Region
                </label>
                <Controller
                  control={control}
                  name="region"
                  rules={{ required: true }}
                  render={({field: {onChange, value}}) => (
                    <div className="flex flex-wrap gap-3">
                      {regionOptions.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          // call field.onChange to pass value to react-hook-form
                          onClick={() => onChange(r.value)}
                          className={`px-6 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
                            value === r.value
                              ? "bg-[#2096a8] border-[#2096a8] text-white shadow-lg shadow-[#2096a8]/40 scale-105"
                              : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/40"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
              <div className="flex flex-wrap justify-start content-start">
                <label htmlFor="companion" className="w-full mb-1 text-left text-[#020f14]">
                  Companion
                </label>
                <Controller
                  control={control}
                  name="companion"
                  rules={{ required: true }}
                  render={({field}) => (
                    <PersonSelector
                      {...field}
                    />
                  )}
                />
              </div>
              <div className="flex flex-wrap justify-start content-start">
                <label htmlFor="budget" className="w-full mb-1 text-left text-[#020f14]">
                  Budget
                </label>
                <Controller
                  control={control}
                  name="budget"
                  rules={{ required: true }}
                  render={({field, fieldState}) => (
                    <div className="w-full">
                      <select
                        {...field}
                        className="w-full px-4 py-5 focus:outline-none border-solid border-1 border-gray-500 rounded-lg text-gray-500 bg-white"
                      >
                        <option value="" disabled>Select Budget Level</option>
                        {budgetOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {fieldState.error && (
                        <p className="text-red-500 text-left mt-1 text-sm">{fieldState.error.message}</p>
                      )}
                    </div>               
                  )}
                />
              </div>
              
            </div>
          </div>
          <div className="mt-10 flex justify-end">
            <button type="submit" className="group bg-[#2096a8] hover:bg-[#1a7a8a] text-white px-12 py-5 rounded-full text-xl font-bold transition-all shadow-lg flex items-center gap-3">
              Take Me Somewhere New
              <ArrowBigRightDash className='pl-2 w-10 group-hover:translate-x-2 transition-transform'/>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}