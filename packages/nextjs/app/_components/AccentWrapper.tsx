import Image from "next/image";

interface AccentWrapperProps {
  children: React.ReactNode;
}

export default function AccentWrapper({ children }: AccentWrapperProps) {
  return (
    <div className="relative overflow-hidden bg-slate-900 pb-24 lg:pb-48">
      <div
        className="absolute inset-0 size-full opacity-70 mix-blend-overlay dark:md:opacity-100"
        style={{
          background: "url(/noise.webp) lightgray 0% 0% / 83.69069695472717px 83.69069695472717px repeat",
        }}
      ></div>
      <Image className="absolute top-0 opacity-50" src="/blur-cyan.png" alt="" width={530} height={530} />
      <Image className="absolute -top-64 -right-32" src="/blur-cyan.png" alt="" width={530} height={530} priority />
      <Image className="absolute -right-12 bottom-24" src="/blur-indigo.png" alt="" width={567} height={567} priority />
      {children}
    </div>
  );
}
