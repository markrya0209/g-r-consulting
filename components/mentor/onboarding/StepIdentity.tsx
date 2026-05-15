'use client';

import { useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { MentorProfileRow } from '@/lib/supabase/database.types';
import { UNIVERSITIES, LANGUAGES, YEAR_OPTIONS } from '@/lib/constants';

interface Props {
  userId: string;
  profile: MentorProfileRow;
  userName: string | null;
  onNext: (updated: MentorProfileRow) => void;
}

function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export default function StepIdentity({ userId, profile, userName, onNext }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [fullName, setFullName] = useState(userName ?? '');
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [university, setUniversity] = useState(profile.university ?? '');
  const [faculty, setFaculty] = useState(profile.faculty ?? '');
  const [course, setCourse] = useState(profile.course ?? '');
  const [year, setYear] = useState<number>(profile.year ?? 1);
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? ['Português']);
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.photo_url);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('A foto deve ter no máximo 5MB.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !displayName.trim() || !university) {
      setError('Preenche todos os campos obrigatórios.');
      return;
    }
    if (languages.length === 0) {
      setError('Seleciona pelo menos um idioma.');
      return;
    }

    setLoading(true);

    try {
      // Upload photo if changed
      let photoUrl = profile.photo_url;
      if (photoFile) {
        const cropped = await cropToSquare(photoFile);
        const path = `${userId}/avatar.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, cropped, { contentType: 'image/jpeg', upsert: true });
        if (uploadErr) throw new Error(uploadErr.message);

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      // Generate slug
      const { data: slug, error: slugErr } = await supabase.rpc('generate_mentor_slug', {
        p_display_name: displayName,
        p_exclude_id: profile.id,
      });
      if (slugErr) throw new Error(slugErr.message);

      // Update users.display_name
      await supabase.from('users').update({ display_name: fullName }).eq('id', userId);

      // Update mentor_profiles
      const { data: updated, error: updateErr } = await supabase
        .from('mentor_profiles')
        .update({
          display_name: displayName,
          slug,
          bio: bio || null,
          university,
          faculty: faculty || null,
          course: course || null,
          year,
          languages,
          photo_url: photoUrl,
          onboarding_step: Math.max(profile.onboarding_step, 2),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (updateErr) throw new Error(updateErr.message);
      onNext(updated!);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao guardar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-bold text-[--grc-ink]">Identidade e perfil</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Photo */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full bg-[--grc-bg-muted] flex items-center justify-center overflow-hidden cursor-pointer border-2 border-[--grc-border]"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[--grc-ink-muted] text-xs text-center">Adicionar foto</span>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-sm text-[--grc-accent] hover:underline"
        >
          {photoPreview ? 'Alterar foto' : 'Carregar foto'}
        </button>
      </div>

      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-[--grc-ink] mb-1">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink]"
        />
      </div>

      {/* Display name */}
      <div>
        <label className="block text-sm font-medium text-[--grc-ink] mb-1">
          Nome público (exibido no perfil) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          placeholder="ex: Ana S."
          className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink] placeholder-[--grc-ink]/40"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-[--grc-ink] mb-1">
          Bio curta
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Fala um pouco sobre a tua experiência..."
          className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink] placeholder-[--grc-ink]/40 resize-none"
        />
        <p className="text-xs text-[--grc-ink-muted] mt-1">{bio.length}/300</p>
      </div>

      {/* University */}
      <div>
        <label className="block text-sm font-medium text-[--grc-ink] mb-1">
          Universidade <span className="text-red-500">*</span>
        </label>
        <select
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          required
          className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink]"
        >
          <option value="">Selecionar...</option>
          {UNIVERSITIES.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Faculty + Course in a row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[--grc-ink] mb-1">Faculdade</label>
          <input
            type="text"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[--grc-ink] mb-1">Curso</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink]"
          />
        </div>
      </div>

      {/* Year */}
      <div>
        <label className="block text-sm font-medium text-[--grc-ink] mb-1">Ano atual</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full px-4 py-2 border border-[--grc-border] rounded-lg bg-white text-[--grc-ink]"
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y.value} value={y.value}>{y.label}</option>
          ))}
        </select>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-[--grc-ink] mb-1">
          Idiomas <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                languages.includes(lang)
                  ? 'bg-[--grc-accent] text-white border-[--grc-accent]'
                  : 'bg-white text-[--grc-ink] border-[--grc-border] hover:border-[--grc-accent]'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[--grc-accent] text-white font-medium py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'A guardar...' : 'Seguinte →'}
      </button>
    </form>
  );
}
