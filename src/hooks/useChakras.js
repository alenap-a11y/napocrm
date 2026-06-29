import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useChakraEvaluations(clientId) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvaluations = async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('chakra_evaluations')
      .select('*')
      .eq('client_id', clientId)
      .order('session_num', { ascending: true });
    if (error) { console.error(error); setError(error); }
    else setEvaluations(data);
    setLoading(false);
  };

  useEffect(() => { fetchEvaluations(); }, [clientId]);

  return { evaluations, loading, error, refresh: fetchEvaluations };
}

export function useChakraProgression(clientId) {
  const [progression, setProgression] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgression = async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('chakra_progression')
      .select('*')
      .eq('client_id', clientId);
    if (error) { console.error(error); setError(error); }
    else setProgression(data);
    setLoading(false);
  };

  useEffect(() => { fetchProgression(); }, [clientId]);

  return { progression, loading, error, refresh: fetchProgression };
}

export async function saveChakraEvaluation(data) {
  const { error } = await supabase.from('chakra_evaluations').insert(data);
  if (error) { console.error(error); throw error; }
}
