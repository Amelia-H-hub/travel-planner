import homePageBg from '../assets/homePage.jpg';
import { Controller, useForm } from 'react-hook-form';
import Flatpickr from 'react-flatpickr';
import "flatpickr/dist/themes/airbnb.css";
import AutoComplete from '../components/AutoComplete';
import PersonSelector from '../components/PersonSelector';
import { ArrowBigRightDash } from 'lucide-react';

export default function HomePage() {

  const { control, handleSubmit} = useForm({
    defaultValues: {
      city: "",
      dateRange: [],
      people: ""
    }
  });

  const onSubmit = (data: any) => {
    console.log('React FormEvent==========', data);
  }

  const onError = (errors: any) => {
  console.error('❌ Form validation errors:', errors);
};

  const searchCities = async (input: string) => {
    const res = await fetch("http://localhost:8000/api/home/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: input }),
    });
    const data = await res.json();
    console.log("Search cities response:", data);
    return data.cities;
  }

  const onCitySelet = (value: any) => {
    return `${value.city}, ${value.country}`
  }

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 w-full min-h-screen object-cover bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${homePageBg})`}}></div>
      <div className="absolute inset-0 bg-black/35"></div>
      <div className="relative z-10 top-50 px-20">
        <div className="text-white text-[36px] mb-4 font-black">
          Let The Journey Begin
        </div>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-[#F0F0F0]/60 py-10 px-16 rounded-2xl shadow-3xl backdrop-blur-md">
          <div>
            <div className="w-full mb-6">
              <Controller
                control={control}
                name="city"
                rules={{ required: true }}
                render={({field}) => (
                  <AutoComplete
                    {...field}
                    placeholder="Search a city"
                    onSearch={searchCities}
                    onSelect={onCitySelet}
                    displayFormat={(item: any) => `${item.city}, ${item.country}`}
                  ></AutoComplete>
                )}
              >
              </Controller>
              
            </div>
            <div className="flex justify-between items-center w-full gap-3">
              <div className="flex flex-wrap justify-start w-1/3 relative">
                <label htmlFor="dateRange" className="w-full mb-2 text-left text-[#020f14]">
                  Departure / Return Date
                </label>
                <Controller
                  control={control}
                  name="dateRange"
                  rules={{ required: true }}
                  render = {({field}) => {
                    const { onChange, onBlur, value, ref } = field;
                    return (
                      <Flatpickr
                        id="dateRange"
                        options={{
                          mode: "range",
                          dateFormat: "Y-m-d",
                          closeOnSelect: false,
                        }}
                        value={value}
                        onClose={(selectedDates) => {
                          onChange(selectedDates);
                        }}
                        onBlur={onBlur}
                        placeholder="YYYY-MM-DD"
                        className="bg-white w-full text-[#3C3C3C] px-6 py-5 rounded-lg"
                        ref={ref}
                    />
                    )
                  }}
                >
                </Controller>
              </div>
              <div className="flex flex-wrap justify-start w-1/3">
                <label htmlFor="people" className="w-full mb-2 text-left text-[#020f14]">
                  Number of People by Age
                </label>
                <Controller
                  control={control}
                  name="people"
                  rules={{ required: true }}
                  render={({field}) => (
                    <PersonSelector
                      {...field}
                    />
                  )}
                >
                </Controller>
              </div>
              <div className="flex justify-end w-1/3">
                <button type="submit" onClick={() => console.log("Submit button clicked!")} className="flex justify-center items-center bg-[#2096a8] hover:bg-[#4fa2b1] !border-0 w-full text-white px-6 py-5 rounded-lg">
                  Get Recommendation
                  <ArrowBigRightDash className='pl-2 w-10'/>
                </button>
              </div>
            </div>
          </div>
        </form>
        <div className="mt-8">
          <p className="text-white text-3xl font-bold">
            Need some inspiration?
          </p>
        </div>
      </div>
    </div>
    
  )
}