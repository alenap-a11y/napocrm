import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('nom');
    if (error) console.error(error);
    else setClients(data);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const addClient = async (fields) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('clients').insert({ ...fields, date_naissance: fields.date_naissance || null, user_id: user?.id || null });
    if (error) console.error(error); else fetchClients();
  };

  const updateClient = async (id, fields) => {
    const { error } = await supabase.from('clients').update({ ...fields, date_naissance: fields.date_naissance || null }).eq('id', id);
    if (error) console.error(error); else fetchClients();
  };

  const deleteClient = async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) console.error(error); else fetchClients();
  };

  return { clients, loading, addClient, updateClient, deleteClient, refresh: fetchClients };
}
