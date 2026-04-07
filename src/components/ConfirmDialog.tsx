import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface Props { dialog: { isOpen: boolean; title: string; message: string; confirmText: string; action: () => void; }; setDialog: (val: any) => void; }

export default function ConfirmDialog({ dialog, setDialog }: Props) {
  return (
    <AnimatePresence>
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/90" onClick={() => setDialog({ ...dialog, isOpen: false })} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "tween", duration: 0.2 }} className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl relative z-10 w-full max-w-sm flex flex-col items-center text-center mx-4">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20"><AlertTriangle className="w-8 h-8" /></div>
            <h3 className="text-2xl font-black text-white mb-2">{dialog.title}</h3>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed px-2">{dialog.message}</p>
            <div className="flex w-full gap-3">
              <button onClick={() => setDialog({ ...dialog, isOpen: false })} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3.5 md:py-4 rounded-2xl font-bold transition-colors text-sm active:scale-95">Cancel</button>
              <button onClick={dialog.action} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3.5 md:py-4 rounded-2xl font-bold transition-colors text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95">{dialog.confirmText}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}