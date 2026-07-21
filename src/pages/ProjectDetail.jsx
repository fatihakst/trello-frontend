import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const res = await API.get(`/Projects/${id}`);
            setProject(res.data);
        } catch (err) {
            console.error('Proje detayları çekilemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;
    if (!project) return <div style={{ padding: '20px' }}>Proje bulunamadı!</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>
                ← Projelere Dön
            </button>

            <h2>{project.title}</h2>
            <p style={{ color: '#666' }}>{project.description}</p>

            <hr style={{ margin: '20px 0', border: '0.5px solid #eee' }} />

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <p>Henüz bu projede liste yok.</p>
            </div>
        </div>
    );
}