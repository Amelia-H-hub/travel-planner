import homePageBg from '../assets/homePage.jpg';
import { Controller, useForm } from 'react-hook-form';
import Flatpickr from 'react-flatpickr';
import "flatpickr/dist/themes/airbnb.css";
import AutoComplete from '../components/AutoComplete';
import PersonSelector from '../components/PersonSelector';
import FloatingInspirationBtn from '../components/FloatingInspirationBtn'; 
import { ArrowBigRightDash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/constants';
import FormPageLayout from '../components/FormPageLayout';


export default function HomePage() {

  const { control, handleSubmit} = useForm({
    defaultValues: {
      city: "",
      dateRange: [],
      people: ""
    }
  });
  
  const navigate = useNavigate();

  const onSubmit =  async (data: any) => {
    const city = data.city.name;
    const startDate = formatDate(data.dateRange[0]);
    const endDate = formatDate(data.dateRange[1]);

    navigate('/eventsRecommendation', {
      state: {
        city: city,
        start_date: startDate,
        end_date: endDate
      }
    });
  }

  const onError = (errors: any) => {
    console.error('❌ Form validation errors:', errors);
  };

  const searchCities = async (input: string) => {
    const res = await fetch(`${API_BASE_URL}/api/home/cities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: input }),
    });
    const data = await res.json();
    console.log("Search cities response:", data);
    return data.cities;
  }

  const onCitySelet = (value: any) => {
    return `${value.name}, ${value.country_name}`;
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return (
    <>
      <FormPageLayout
        backgroundImage={homePageBg}
        title="Let The Journey Begin"
        subtitle=""
      >
        <form onSubmit={handleSubmit(onSubmit, onError)}>
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
                    displayFormat={(item: any) => `${item.name}, ${item.country_name}`}
                  ></AutoComplete>
                )}
              >
              </Controller>
              
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-wrap justify-start">
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
                        placeholder="YYYY-MM-DD to YYYY-MM-DD"
                        className="bg-slate-200/60! w-full text-[#3C3C3C] px-6 py-5 rounded-lg"
                        ref={ref}
                    />
                    )
                  }}
                >
                </Controller>
              </div>
              <div className="flex flex-wrap justify-start">
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
              <div className="flex justify-end mt-8">
                <button type="submit" className="group bg-[#2096a8]! hover:bg-[#1a7a8a] text-white px-10 py-4 rounded-full text-xl font-bold transition-all shadow-lg flex items-center gap-3 w-full md:w-auto justify-center">
                  Get Recommendation
                  <ArrowBigRightDash className='pl-2 w-10 group-hover:translate-x-2 transition-transform'/>
                </button>
              </div>
            </div>
          </div>
        </form>
      </FormPageLayout>
      <FloatingInspirationBtn />
    </>
  )
}