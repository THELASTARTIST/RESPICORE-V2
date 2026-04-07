// app/layout.tsx
import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RespiCore - Respiratory Health Platform",
  description:
    "Track, monitor, and improve your respiratory health with AI-powered acoustic analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.className} bg-slate-900 text-white antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  if(window.ethereum){try{window.ethereum.request=function(){return Promise.reject({code:-32002,message:'No wallet connection'})}}catch(e){}}
  var _ce=window.console.error;
  window.console.error=function(){
    var a=arguments[0];
    if(typeof a==='string'&&(a.indexOf('MetaMask')!==-1||a.indexOf('ethereum')!==-1))return;
    _ce.apply(console,arguments);
  };
})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}