import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [lists, setLists] = useState([]);
    const [listTitle, setListTitle] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjectDetails();
        fetchLists();
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

    // Projeye ait listeleri çekme
    const fetchLists = async () => {
        try {
            // Not: Backend'deki endpoint yapına göre bu URL değişebilir
            const res = await API.get(`/Lists?projectId=${id}`);
            setLists(res.data);
        } catch (err) {
            console.error('Listeler çekilemedi:', err);
        }
    };

    // Yeni liste ekleme
    const handleAddList = async (e) => {
        e.preventDefault();
        if (!listTitle.trim()) return;

        try {
            await API.post('/Lists', {
                title: listTitle,
                projectId: parseInt(id)
            });
            setListTitle('');
            fetchLists(); // Eklendikten sonra listeyi yenile
        } catch (err) {
            console.error('Liste eklenirken hata:', err);
            alert('Liste eklenemedi, backend bağlantısını kontrol edin.');
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;
    if (!project) return <div style={{ padding: '20px' }}>Proje bulunamadı!</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div>
                <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>
                    ← Projelere Dön
                </button>
                <h2>{project.title}</h2>
                <p style={{ color: '#666' }}>{project.description}</p>
                <hr style={{ margin: '20px 0', border: '0.5px solid #eee' }} />
            </div>

            {/* Listeler Alanı (Yatay Kaydırılabilir) */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '20px', flexGrow: 1 }}>

                {/* Mevcut Listeler */}
                {lists.map((list) => (
                    <div key={list.id} style={{ minWidth: '280px', backgroundColor: '#f4f5f7', padding: '10px', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 10px 0', padding: '5px' }}>{list.title}</h4>

                        {/* Kartlar buraya eklenecek (Sonraki Aşama) */}
                        <div style={{ minHeight: '50px', backgroundColor: '#eaeaea', borderRadius: '4px', marginBottom: '10px', padding: '5px', fontSize: '12px', color: '#888' }}>
                            Kartlar buraya gelecek...
                        </div>
                    </div>
                ))}

                {/* Yeni Liste Ekleme Formu */}
                <div style={{ minWidth: '280px', backgroundColor: '#f4f5f7', padding: '10px', borderRadius: '8px' }}>
                    <form onSubmit={handleAddList}>
                        <input
                            type="text"
                            placeholder="Yeni Liste Adı (örn: To Do)"
                            value={listTitle}
                            onChange={(e) => setListTitle(e.target.value)}
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <button type="submit" style={{ padding: '8px', width: '100%', cursor: 'pointer', backgroundColor: '#0079bf', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Liste Ekle
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}