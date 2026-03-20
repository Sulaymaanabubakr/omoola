import { Link } from 'react-router-dom';
import { Leaf, MapPin, Phone, Clock, MessageCircle } from 'lucide-react';

export default function Footer() {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '2348000000000';

  return (
    <footer className="bg-brand-950 text-white">
      <div className="container-app py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-white">Omoola</p>
                <p className="text-[9px] uppercase tracking-widest text-brand-300">Supermarket Stores</p>
              </div>
            </div>
            <p className="text-brand-300 text-sm leading-relaxed">
              Your trusted neighborhood supermarket in Owode Yewa, Ogun State. 
              Fresh groceries, quality provisions, and household essentials every day.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#20b558] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              {[
                { label: 'Home', to: '/' },
                { label: 'Products', to: '/products' },
                { label: 'Cart', to: '/cart' },
                { label: 'Contact Us', to: '/contact' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-brand-300 hover:text-white text-sm transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Find Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-brand-300">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand-400" />
                <span>Owode Yewa, Ogun State, Nigeria</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-300">
                <Phone className="w-4 h-4 shrink-0 text-brand-400" />
                <a href={`tel:+${whatsappNumber}`} className="hover:text-white transition-colors">
                  +{whatsappNumber}
                </a>
              </div>
              <div className="flex items-start gap-3 text-sm text-brand-300">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-brand-400" />
                <div>
                  <p>Mon – Sat: 7:00 AM – 9:00 PM</p>
                  <p>Sunday: 9:00 AM – 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-brand-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-brand-400 text-xs">
            © {new Date().getFullYear()} Omoola Supermarket Stores. All rights reserved.
          </p>
          <p className="text-brand-500 text-xs">Built with ❤️ in Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
