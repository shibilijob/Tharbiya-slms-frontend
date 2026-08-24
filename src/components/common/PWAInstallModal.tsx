import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Logo } from './Logo';
import { 
  Smartphone, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Download, 
  Monitor, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInstalled: boolean;
  onNativeInstallPrompt?: () => void;
  isInstallable?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isInstalled,
  onNativeInstallPrompt,
  isInstallable
}) => {
  if (isInstalled) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Tharbiyah is Installed! 🎉"
        subtitle="App is already added to your device"
        maxWidth="md"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Logo size="lg" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#1F2933]">
              Ready on your Home Screen
            </h4>
            <p className="text-sm text-[#667085] mt-1 max-w-sm mx-auto">
              Tharbiyah is installed. You can launch it anytime directly from your mobile home screen or desktop application menu for instant access!
            </p>
          </div>
          <Button variant="primary" className="w-full mt-2" onClick={onClose}>
            Got it, Alhamdulillah
          </Button>
        </div>
      </Modal>
    );
  }

  if (isIOS) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Tharbiyah to Home Screen"
        subtitle="Follow these 3 simple steps on iPhone / iPad (Safari)"
        maxWidth="md"
      >
        <div className="space-y-4 py-2">
          <div className="bg-[#FAF8F2] border border-[#E3EAE6] p-4 rounded-2xl flex items-center gap-3.5">
            <Logo size="md" />
            <div>
              <p className="text-sm font-bold text-[#1F2933]">Tharbiyah App</p>
              <p className="text-xs text-[#667085]">Instant 1-tap access with full-screen experience</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E3EAE6]">
              <div className="w-7 h-7 rounded-full bg-[#0F6B50] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-[#1F2933] flex items-center gap-1.5">
                  Tap the <span className="inline-flex items-center text-[#0F6B50] font-extrabold bg-[#DDEDE5] px-1.5 py-0.5 rounded">Share <Share2 className="w-3.5 h-3.5 ml-1" /></span> button
                </p>
                <p className="text-[#667085] mt-0.5">
                  Located at the bottom of Safari (or top menu on iPad).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E3EAE6]">
              <div className="w-7 h-7 rounded-full bg-[#0F6B50] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-[#1F2933] flex items-center gap-1.5">
                  Choose <span className="inline-flex items-center text-[#0F6B50] font-extrabold bg-[#DDEDE5] px-1.5 py-0.5 rounded">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 ml-1" /></span>
                </p>
                <p className="text-[#667085] mt-0.5">
                  Scroll down the share sheet options until you see &ldquo;Add to Home Screen&rdquo;.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E3EAE6]">
              <div className="w-7 h-7 rounded-full bg-[#0F6B50] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-[#1F2933]">
                  Tap <span className="text-[#0F6B50] font-extrabold">&ldquo;Add&rdquo;</span> in top-right
                </p>
                <p className="text-[#667085] mt-0.5">
                  The Tharbiyah app icon will now appear on your home screen!
                </p>
              </div>
            </div>
          </div>

          <Button variant="primary" className="w-full mt-3" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  // Desktop / Android fallback modal
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Install Tharbiyah App"
      subtitle="Fast, standalone access on Desktop & Mobile"
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        <div className="bg-[#FAF8F2] border border-[#E3EAE6] p-4 rounded-2xl flex items-center gap-3.5">
          <Logo size="md" />
          <div>
            <p className="text-sm font-bold text-[#1F2933]">Install on Desktop or Phone</p>
            <p className="text-xs text-[#667085]">Opens in its own sleek app window without browser tabs</p>
          </div>
        </div>

        {isInstallable && onNativeInstallPrompt ? (
          <div className="p-4 bg-[#DDEDE5]/50 border border-[#bbdcd0] rounded-2xl text-center space-y-3">
            <p className="text-sm font-bold text-[#084C3A]">
              Click the button below to prompt direct installation:
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              leftIcon={<Download className="w-5 h-5" />}
              onClick={() => {
                onNativeInstallPrompt();
                onClose();
              }}
            >
              Install App Now
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* If Already Installed or In Browser with App Installed */}
            <div className="p-3.5 rounded-xl bg-[#DDEDE5]/60 border border-[#0F6B50]/30 text-xs sm:text-sm space-y-1.5">
              <p className="font-bold text-[#084C3A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0F6B50] shrink-0" />
                Already Installed on this Device:
              </p>
              <p className="text-[#1F2933]">
                Look at the top-right of your browser&apos;s address bar (URL bar) and click <strong className="text-[#084C3A] bg-white px-1.5 py-0.5 rounded border border-[#0F6B50]/20 font-extrabold">Open in app</strong>, or search <strong>&ldquo;Tharbiyah&rdquo;</strong> in your Windows Start menu.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E3EAE6]">
              <Monitor className="w-6 h-6 text-[#0F6B50] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-[#1F2933]">On Desktop (Chrome / Edge / Windows / Mac):</p>
                <p className="text-[#667085] mt-1">
                  Click the <strong>Install icon</strong> (📥 / 💻) in the URL bar, or click browser menu (⋮) → <strong>Install Tharbiyah</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E3EAE6]">
              <Smartphone className="w-6 h-6 text-[#0F6B50]" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-[#1F2933]">On Mobile Phone (Android / iPhone):</p>
                <p className="text-[#667085] mt-1">
                  On Android: Tap browser menu (⋮) → <strong>&ldquo;Install app&rdquo;</strong> / <strong>&ldquo;Add to Home screen&rdquo;</strong>.<br />
                  On iPhone (Safari): Tap <strong>Share</strong> (📤) → <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full mt-2" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
