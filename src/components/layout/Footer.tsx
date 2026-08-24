import React from 'react';
import { Heart, MapPin, Phone, Mail, Sparkles } from 'lucide-react';
import { Logo } from '../common/Logo';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-[#084C3A] text-white border-t border-[#0F6B50] scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Col (Spans 6 cols on md/lg) */}
          <div className="md:col-span-6 space-y-4">
            <Logo size="lg" showText textDark={false} title="Tharbiyah" subtitle="Darunnajath Mundambra" />

            <p className="font-malayalam text-base sm:text-lg font-bold text-[#FAF8F2] tracking-wide">
              &ldquo;ഓരോ കുട്ടിയുടെയും വളർച്ചയിൽ, ഒരു പടി കൂടി മുന്നോട്ട്.&rdquo;
            </p>

            <p className="text-xs sm:text-sm text-[#DDEDE5]/80 leading-relaxed max-w-md">
              A dedicated modern Madrasa digital platform connecting Muallims and parents for holistic Islamic education, Quranic mastery, attendance monitoring, and Practical development.
            </p>

            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F6B50]/60 border border-[#C9A227]/40 text-xs text-[#FAF8F2] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                Darunnajath Mundambra Madrasa Portal
              </span>
            </div>
          </div>

          {/* Quick Links Col (Spans 2 cols on md/lg) */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A227]">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#DDEDE5]">
              <li>
                <a href="/#home" className="hover:text-white transition-colors block py-0.5">
                  Home
                </a>
              </li>
              <li>
                <a href="/#features" className="hover:text-white transition-colors block py-0.5">
                  Features
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-white transition-colors block py-0.5">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-white transition-colors block py-0.5">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Col (Spans 4 cols on md/lg) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A227]">
              Madrasa Information
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-[#DDEDE5]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <span className="leading-snug">Darunnajath Madrasa, Mundambra, Malappuram, Kerala - 673639</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C9A227] shrink-0" />
                <a href="tel:+917306426930" className="hover:text-white transition-colors">
                  +91 7306426930
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C9A227] shrink-0" />
                <span className="text-[#DDEDE5]/90">darunnajathmundambra@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#0F6B50] flex flex-col sm:flex-row items-center justify-between text-xs text-[#DDEDE5]/70 gap-4 text-center sm:text-left">
          <p>© 2026 Tharbiyah — Darunnajath Mundambra. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1.5">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-[#C9A227] fill-[#C9A227] inline-block" />
            <span>Islamic values & education for the Ummah</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
