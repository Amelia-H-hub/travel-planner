import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';

export default function FloatingInspirationBtn() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/inspiration')}
      title="Need Inspiration?"
      className="fixed bottom-10 right-10 z-[1000] flex items-center gap-2 rounded-full bg-[#ff9f1c] px-5 py-4 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#ffbf69] hover:shadow-xl md:rounded-[50px]"
    >
      <Lightbulb size={28}></Lightbulb>
      <span className="hidden font-bold md:block">Need Inspiration?</span>
    </button>
  )
}
