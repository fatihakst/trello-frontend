import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [listTitle, setListTitle] = useState('');
    const [newTaskTitles, setNewTaskTitles] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Düzenleme state'leri
    const [editingTask, setEditingTask] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    // YENİ: Etiket state'leri
    const [editLabelText, setEditLabelText] = useState('');
    const [editLabelColor, setEditLabelColor] = useState('#108ee9');

    useEffect(() => {
        setIsMounted(true);
        fetchProjectDetails();
        fetchLists();
        fetchTasks();
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

    const fetchLists = async () => {
        try {
            const res = await API.get(`/Lists?projectId=${id}`);
            setLists(res.data);
        } catch (err) {
            console.error('Listeler çekilemedi:', err);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await API.get(`/Tasks/project/${id}`);
            setTasks(res.data);
        } catch (err) {
            console.error('Görevler çekilemedi:', err);
        }
    };

    const handleAddList = async (e) => {
        e.preventDefault();
        if (!listTitle.trim()) return;

        try {
            await API.post('/Lists', { title: listTitle, projectId: parseInt(id) });
            setListTitle('');
            fetchLists();
        } catch (err) {
            console.error('Liste eklenirken hata:', err);
        }
    };

    const handleDeleteList = async (listId) => {
        const confirmDelete = window.confirm('Bu listeyi ve içindeki tüm görevleri silmek istediğinize emin misiniz?');
        if (!confirmDelete) return;

        try {
            await API.delete(`/Lists/${listId}`);
            fetchLists();
            fetchTasks();
        } catch (err) {
            console.error('Liste silinirken hata:', err);
        }
    };

    const handleAddTask = async (e, listId) => {
        e.preventDefault();
        const title = newTaskTitles[listId];
        if (!title || !title.trim()) return;

        try {
            await API.post('/Tasks', {
                projectId: parseInt(id),
                title: title,
                description: '',
                status: listId.toString()
            });

            setNewTaskTitles({ ...newTaskTitles, [listId]: '' });
            fetchTasks();
        } catch (err) {
            console.error('Görev eklenirken hata:', err);
        }
    };

    const handleDeleteTask = async (taskId) => {
        const confirmDelete = window.confirm('Bu görevi silmek istediğinize emin misiniz?');
        if (!confirmDelete) return;

        try {
            await API.delete(`/Tasks/${taskId}`);
            fetchTasks();
        } catch (err) {
            console.error('Görev silinirken hata:', err);
        }
    };

    // YENİ: Modal açıldığında etiket bilgilerini de state'e alıyoruz
    const openEditModal = (task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDescription(task.description || '');
        setEditLabelText(task.labelText || '');
        setEditLabelColor(task.labelColor || '#108ee9');
    };

    // YENİ: Kaydederken etiket bilgilerini de backend'e gönderiyoruz
    const handleSaveTask = async () => {
        if (!editTitle.trim()) return;

        try {
            await API.put(`/Tasks/${editingTask.id}`, {
                projectId: editingTask.projectId,
                title: editTitle,
                description: editDescription,
                status: editingTask.status,
                assignedToUserId: editingTask.assignedToUserId,
                labelText: editLabelText,
                labelColor: editLabelColor
            });
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            console.error('Görev güncellenirken hata:', err);
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'list') {
            const newLists = Array.from(lists);
            const [draggedList] = newLists.splice(source.index, 1);
            newLists.splice(destination.index, 0, draggedList);

            setLists(newLists);

            const reorderData = newLists.map((list, index) => ({
                id: list.id,
                order: index
            }));

            try {
                await API.put('/Lists/reorder', reorderData);
            } catch (err) {
                console.error('Liste taşınırken hata:', err);
                fetchLists();
            }
            return;
        }

        const items = Array.from(tasks);
        const draggedItemIndex = items.findIndex(t => t.id.toString() === draggableId);
        const [draggedItem] = items.splice(draggedItemIndex, 1);

        draggedItem.status = destination.droppableId;
        const targetListItems = items.filter(t => t.status === destination.droppableId);

        if (destination.index === 0) {
            if (targetListItems.length > 0) {
                const insertIndex = items.indexOf(targetListItems[0]);
                items.splice(insertIndex, 0, draggedItem);
            } else {
                items.push(draggedItem);
            }
        } else {
            const itemBefore = targetListItems[destination.index - 1];
            const insertIndex = items.indexOf(itemBefore) + 1;
            items.splice(insertIndex, 0, draggedItem);
        }

        setTasks(items);

        const reorderData = items.map((task, index) => ({
            id: task.id,
            order: index,
            status: task.status
        }));

        try {
            await API.put('/Tasks/reorder', reorderData);
        } catch (err) {
            console.error('API Hatası:', err);
        }
    };

    if (!isMounted || loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;
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

            <DragDropContext onDragEnd={onDragEnd}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '20px', flexGrow: 1 }}>

                    <Droppable droppableId="all-lists" direction="horizontal" type="list">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{ display: 'flex', gap: '20px' }}
                            >
                                {lists.map((list, index) => (
                                    <Draggable key={`list-${list.id}`} draggableId={`list-${list.id}`} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={{
                                                    minWidth: '280px',
                                                    backgroundColor: '#f4f5f7',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    ...provided.draggableProps.style
                                                }}
                                            >
                                                <div
                                                    {...provided.dragHandleProps}
                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', cursor: 'grab' }}
                                                >
                                                    <h4 style={{ margin: '0', padding: '5px' }}>{list.title}</h4>
                                                    <button
                                                        onClick={() => handleDeleteList(list.id)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '14px' }}
                                                        title="Listeyi Sil"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>

                                                <Droppable droppableId={list.id.toString()} type="task">
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            style={{ minHeight: '20px', marginBottom: '10px' }}
                                                        >
                                                            {tasks.filter(task => task.status === list.id.toString()).map((task, index) => (
                                                                <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                                                    {(provided) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            style={{
                                                                                userSelect: 'none',
                                                                                cursor: 'grab',
                                                                                backgroundColor: 'white',
                                                                                padding: '10px',
                                                                                borderRadius: '4px',
                                                                                marginBottom: '8px',
                                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                                                                display: 'flex',
                                                                                flexDirection: 'column', // YENİ: İçerik alt alta gelsin diye column yapıldı
                                                                                ...provided.draggableProps.style
                                                                            }}
                                                                        >
                                                                            {/* YENİ: Etiket Gösterimi */}
                                                                            {task.labelText && (
                                                                                <div style={{
                                                                                    backgroundColor: task.labelColor || '#108ee9',
                                                                                    color: '#fff',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '12px',
                                                                                    fontWeight: 'bold',
                                                                                    marginBottom: '8px',
                                                                                    alignSelf: 'flex-start'
                                                                                }}>
                                                                                    {task.labelText}
                                                                                </div>
                                                                            )}

                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                                                <span>{task.title}</span>

                                                                                <div>
                                                                                    <button
                                                                                        onClick={() => openEditModal(task)}
                                                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', marginRight: '8px' }}
                                                                                        title="Görevi Düzenle"
                                                                                    >
                                                                                        ✏️
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteTask(task.id)}
                                                                                        style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                                                                                        title="Görevi Sil"
                                                                                    >
                                                                                        X
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>

                                                <form onSubmit={(e) => handleAddTask(e, list.id)}>
                                                    <input
                                                        type="text"
                                                        placeholder="Kart ekle..."
                                                        value={newTaskTitles[list.id] || ''}
                                                        onChange={(e) => setNewTaskTitles({ ...newTaskTitles, [list.id]: e.target.value })}
                                                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '5px', borderRadius: '4px', border: 'none' }}
                                                    />
                                                    <button type="submit" style={{ display: 'none' }}>Ekle</button>
                                                </form>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

                    <div style={{ minWidth: '280px', backgroundColor: '#f4f5f7', padding: '10px', borderRadius: '8px' }}>
                        <form onSubmit={handleAddList}>
                            <input
                                type="text"
                                placeholder="Yeni Liste Adı..."
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
            </DragDropContext>

            {editingTask && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px',
                        display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>Kartı Düzenle</h3>

                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Başlık</label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            style={{ padding: '8px', width: '100%', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                        />

                        {/* YENİ: Etiket Düzenleme Alanı */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                            <div style={{ flexGrow: 1 }}>
                                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Etiket Adı</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Acil, Frontend..."
                                    value={editLabelText}
                                    onChange={(e) => setEditLabelText(e.target.value)}
                                    style={{ padding: '8px', width: '100%', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Renk</label>
                                <input
                                    type="color"
                                    value={editLabelColor}
                                    onChange={(e) => setEditLabelColor(e.target.value)}
                                    style={{ width: '40px', height: '35px', padding: '0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                                />
                            </div>
                        </div>

                        <label style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '5px' }}>Açıklama</label>
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={4}
                            placeholder="Bu görev için daha detaylı bir açıklama ekleyin..."
                            style={{ padding: '8px', width: '100%', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                            <button onClick={() => setEditingTask(null)} style={{ padding: '8px 16px', cursor: 'pointer', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px' }}>
                                İptal
                            </button>
                            <button onClick={handleSaveTask} style={{ padding: '8px 16px', backgroundColor: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}