import Hero from '../sections/Hero.jsx';
import QuickLinks from '../sections/QuickLinks.jsx';
import Accolades from '../sections/Accolades.jsx';
import About from '../sections/About.jsx';
import MenuHighlights from '../sections/Services.jsx';
import Gallery from '../sections/Gallery.jsx';
import ReservationsBand from '../sections/Booking.jsx';
import Visit from '../sections/Contact.jsx';

export default function Landing() {
  return (
    <main>
      <Hero />
      <QuickLinks />
      <Accolades />
      <About />
      <MenuHighlights />
      <Gallery />
      <ReservationsBand />
      <Visit />
    </main>
  );
}
