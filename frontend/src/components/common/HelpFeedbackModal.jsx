import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import * as api from '../../utils/api';

// --- Feedback Tab Component (Your existing code, unchanged) ---
const FeedbackTab = ({ onClose }) => {
    const [formData, setFormData] = useState({
        type: 'general',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                ...formData,
                page_url: window.location.href,
                user_agent: navigator.userAgent
            };
            const data = await api.submitFeedback(payload);
            setSuccess(data.message);
            setFormData({ type: 'general', subject: '', message: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-semibold mb-2">Feedback Type</label>
                <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                >
                    <option value="general">General Feedback</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                </select>
            </div>
            <div>
                <label htmlFor="subject" className="block text-sm font-semibold mb-1">Subject</label>
                <input
                    id="subject" type="text" value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" required
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-1">Message</label>
                <textarea
                    id="message" value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    rows="5"
                    className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" required
                />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </div>
        </form>
    );
};


const InviteTab = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);

    const fetchInvites = async () => {
        try {
            const data = await api.getUserInvitations();
            setInvitations(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleSendInvite = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        try {
            await api.sendJoinInvite(email);
            setEmail('');
            toast.success('Invitation sent!');
            fetchInvites();
        } catch (err) {
            // Error is handled by the api client toast
        } finally {
            setSending(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSendInvite} className="flex gap-2 mb-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="flex-grow bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                />
                <button type="submit" disabled={sending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {sending ? 'Sending...' : 'Send'}
                </button>
            </form>

            <h4 className="font-semibold text-lg mb-2">Sent Invitations</h4>
            {loading && <p>Loading invitations...</p>}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && invitations.length === 0 && <p className="text-gray-400">You haven't sent any invitations yet.</p>}
            <ul className="space-y-2">
                {invitations
                    .filter(invite => invite.invite_type === 'join')
                    .map(invite => {
                        const status = invite.status || 'pending';
                        const isPending = status === 'pending';

                        return (
                            <li key={invite.id} className="bg-gray-700/50 p-3 rounded-md">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">{invite.recipient_email}</span>
                                    <span className={`text-xs font-bold py-1 px-2 rounded-full capitalize ${isPending ? 'bg-yellow-500 text-gray-900' : 'bg-green-500 text-white'}`}>
                                        {status}
                                    </span>
                                </div>
                            </li>
                        );
                 })}
            </ul>
        </div>
    );
};

// --- 2. NEW Tutorial Tab Component ---
const TutorialTab = ({ pageKey }) => {
    // 2. Get all help content from the context
    const allContent = useContent();

    // Look up the correct tutorial content based on the pageKey
    const tutorial = allContent ? (allContent[pageKey] || allContent.default) : { title: 'Loading...', content: [] };

    return (
        <div>
            <h3 className="text-xl font-bold text-indigo-400 mb-4">{tutorial.title}</h3>
            {/* 3. Render content using dangerouslySetInnerHTML to support rich text from the DB */}
            <div
                className="space-y-3 text-gray-300 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: tutorial.content[0] }}
            />
        </div>
    );
};

// --- Main Modal Component ---
// 3. Update props to accept pageKey and change default active tab
export default function HelpFeedbackModal({ isOpen, onClose, pageKey }) {
    const [activeTab, setActiveTab] = useState('tutorial');

    // Reset to the tutorial tab whenever the modal is opened
    useEffect(() => {
        if(isOpen) setActiveTab('tutorial');
    }, [isOpen]);

    if (!isOpen) return null;
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'tutorial':
                return <TutorialTab pageKey={pageKey} />;
            case 'feedback':
                return <FeedbackTab onClose={onClose} />;
            case 'invite':
                return <InviteTab />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-full max-w-2xl relative">
                <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
                <div className="mb-4 border-b border-gray-700">
                    <nav className="flex gap-4 -mb-px">
                        {/* Tab buttons remain the same */}
                        <button onClick={() => setActiveTab('tutorial')} className={`py-3 px-1 font-semibold ${activeTab === 'tutorial' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Tutorial</button>
                        <button onClick={() => setActiveTab('feedback')} className={`py-3 px-1 font-semibold ${activeTab === 'feedback' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Submit Feedback</button>
                        <button onClick={() => setActiveTab('invite')} className={`py-3 px-1 font-semibold ${activeTab === 'invite' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Invite a Friend</button>
                    </nav>
                </div>
                <div className="min-h-[300px] max-h-[60vh] overflow-y-auto pr-2">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}