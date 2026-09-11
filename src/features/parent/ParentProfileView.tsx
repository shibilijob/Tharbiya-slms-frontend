import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  Phone,
  Mail,
  Users,
  Building,
  LogOut,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ParentProfileView: React.FC = () => {
  const { user, logout } = useAuth();
  const { students, selectedChildId, setSelectedChildId, isLoading } = useData();
  const navigate = useNavigate();

  const linkedChildren = students;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3EAE6] shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center shrink-0 border-2 border-[#0F6B50]/30 shadow-xs">
            <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#0F6B50]" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
                {user?.name || "Parent"}
              </h1>
              <Badge variant="green">Registered Guardian</Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#667085]">
              Guardian Account • Darunnajath Mundambra
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#667085]">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#0F6B50]" />
                {user?.phone || "Not available"}
              </span>
              {user?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0F6B50]" />
                  {user.email}
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
          </Button>
        </div>
      </div>

      {/* Linked Children Roster */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#1F2933] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0F6B50]" />
              Enrolled Children ({linkedChildren.length})
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Select an active child profile to view progress and records
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading children..." />
        ) : linkedChildren.length === 0 ? (
          <EmptyState
            title="No enrolled children found."
            description="This parent account does not currently have active linked student records."
            icon={<Users className="w-7 h-7" />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {linkedChildren.map(child => {
            const isSelected = child.id === selectedChildId;
            return (
              <div
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                  ? 'bg-[#DDEDE5]/40 border-[#0F6B50] ring-2 ring-[#0F6B50]/20 shadow-xs'
                  : 'bg-[#FAF8F2] border-[#E3EAE6] hover:border-[#0F6B50]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={child.name} gender={child.gender} size="lg" ring={isSelected} />
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2933]">{child.name}</h4>
                    <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{child.malayalamName}</p>
                    <p className="text-[11px] text-[#667085] mt-0.5">
                      Class {child.class} • Adm: {child.admissionNo}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <span className="text-xs font-bold text-[#084C3A] bg-white px-2.5 py-1 rounded-full border border-[#bbdcd0]">
                    Active View
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#667085]" />
                )}
              </div>
            );
          })}
          </div>
        )}
      </Card>

      {/* Madrasa Contact & Guidelines */}
      <Card className="p-6 bg-[#FAF8F2]">
        <h3 className="text-sm font-bold text-[#1F2933] flex items-center gap-2 mb-3">
          <Building className="w-4 h-4 text-[#0F6B50]" />
          Madrasa Administration & Office
        </h3>
        <p className="text-xs text-[#667085] leading-relaxed">
          For admission queries, fee receipts, or leave applications, please contact the Darunnajath Mundambra office directly:
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#E3EAE6]">
            <p className="text-[#667085]">Sadhr Mudarris / Sadhr Muallim Office:</p>
            <p className="font-bold text-[#1F2933] mt-0.5">+91 9946400580</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
