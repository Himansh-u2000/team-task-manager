import { useState, useEffect } from 'react';
import { getAllUsers } from '../services/api';
import { Users, Mail, Shield, User } from 'lucide-react';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers()
      .then((res) => setUsers(res.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-[#2d2d2d]">Team</h1>
        <p className="text-[13px] text-[#888] mt-0.5">
          {users.length} member{users.length !== 1 ? 's' : ''} on your team
        </p>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#bbb]">
          <Users size={36} className="mb-3" />
          <p className="text-[14px] font-medium text-[#888]">No team members yet</p>
          <p className="text-[12px] mt-1">Invite people to your team by signing up</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u) => (
            <div
              key={u._id}
              className="bg-white rounded-lg border border-[#e8e5e0] p-4 flex items-start gap-3 hover:border-[#ccc] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#2d2d2d] flex items-center justify-center shrink-0">
                <User size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[14px] font-medium text-[#2d2d2d] truncate">
                    {u.name}
                  </p>
                  {u.role === 'admin' && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#fef9c3] text-[#ca8a04]">
                      <Shield size={9} /> Admin
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1 text-[12px] text-[#aaa] mt-0.5 truncate">
                  <Mail size={11} /> {u.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
