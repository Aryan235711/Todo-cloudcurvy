
import React from 'react';
import { Briefcase, User, Heart, Layers } from 'lucide-react';
import { Category } from './types';

export const CATEGORIES: { value: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'work', label: 'Work', icon: <Briefcase size={18} />, color: 'bg-cyan-100 text-cyan-600' },
  { value: 'personal', label: 'Personal', icon: <User size={18} />, color: 'bg-mint-100 text-emerald-600' },
  { value: 'health', label: 'Health', icon: <Heart size={18} />, color: 'bg-rose-100 text-rose-500' },
  { value: 'other', label: 'Other', icon: <Layers size={18} />, color: 'bg-sky-100 text-sky-600' },
];

export const APP_TITLE = "CurvyCloud";
