import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalDate } from '../lib/dateUtils';

export function useNotes({ seanceId = null, clientId = null, date = null } = {}) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    setLoading(true);
    let query = supabase.from('notes').select('*').order('date_note', { ascending: false });
    if (seanceId) query = query.eq('seance_id', seanceId);
    if (clientId) query = query.eq('client_id', clientId);
    if (date) query = query.eq('date_note', date);
    const { data, error } = await query;
    if (error) console.error(error);
    else setNotes(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [seanceId, clientId, date]);

  const addNote = async ({ contenu, titre = null, categorie = null, client_id = null, client_nom = null, seance_id = null, date_note = null }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('notes').insert({
      contenu,
      titre,
      categorie,
      client_id,
      client_nom,
      seance_id,
      user_id: user?.id || null,
      date_note: date_note ?? getLocalDate(),
    });
    if (error) console.error(error);
    else fetchNotes();
  };

  const updateNote = async (id, fields) => {
    const { error } = await supabase.from('notes').update(fields).eq('id', id);
    if (error) console.error(error);
    else fetchNotes();
  };

  const deleteNote = async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) console.error(error);
    else fetchNotes();
  };

  return { notes, loading, addNote, updateNote, deleteNote, refresh: fetchNotes };
}
