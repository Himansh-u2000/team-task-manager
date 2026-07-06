export default function StatsCard({ title, value, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-[#eff6ff] text-[#2563eb]',
    green: 'bg-[#f0fdf4] text-[#16a34a]',
    yellow: 'bg-[#fefce8] text-[#ca8a04]',
    red: 'bg-[#fef2f2] text-[#dc2626]',
    purple: 'bg-[#faf5ff] text-[#9333ea]',
    gray: 'bg-[#f9fafb] text-[#6b7280]',
  };

  return (
    <div className="bg-white rounded-lg border border-[#e8e5e0] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] text-[#888] tracking-wide uppercase">{title}</p>
          <p className="mt-1 text-[22px] font-bold text-[#2d2d2d] tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-md ${colors[color] || colors.blue}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
