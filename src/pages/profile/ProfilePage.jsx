import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Grid2x2, Lock, MessageSquare, Pencil, Plus, UserPlus, Users, Grid3X3, Columns2, Columns3, Column } from 'lucide-react';
import api from '../../services/api';

const PROFILE_LAYOUT_STORAGE_KEY = 'social-room-profile-post-layout';
const LAYOUT_SEQUENCE = [3, 4, 1, 2];

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      let media = [];
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadResponse = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        media = [{ mediaUrl: uploadResponse.data, mediaType: 'IMAGE' }];
      }

      await api.post('/posts', {
        caption,
        privacy,
        media,
      });

      onPostCreated();
      onClose();
      setCaption('');
      setPrivacy('PUBLIC');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Unable to create a post right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#34302C] bg-[#211E1B] p-6 shadow-2xl">
        <h2 className="mb-4 text-2xl font-semibold text-[#F5F1E8]">Create Post</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="post-caption" className="mb-2 block text-sm font-medium text-[#A9A198]">
            Caption
          </label>
          <textarea
            id="post-caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={4}
            placeholder="Share something with your friends..."
            className="mb-4 w-full rounded-xl border border-[#34302C] bg-[#121212] px-3 py-2.5 text-[#F5F1E8] placeholder:text-[#A9A198] focus:border-[#C2526A] focus:outline-none"
          />

          <label htmlFor="post-privacy" className="mb-2 block text-sm font-medium text-[#A9A198]">
            Privacy
          </label>
          <select
            id="post-privacy"
            value={privacy}
            onChange={(event) => setPrivacy(event.target.value)}
            className="mb-4 w-full rounded-xl border border-[#34302C] bg-[#121212] px-3 py-2.5 text-[#F5F1E8] focus:border-[#C2526A] focus:outline-none"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>

          <label className="mb-2 block text-sm font-medium text-[#A9A198]">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelection}
            className="mb-4 block w-full text-sm text-[#A9A198] file:mr-4 file:rounded-xl file:border-0 file:bg-[#C2526A] file:px-4 file:py-2 file:font-semibold file:text-[#121212]"
          />

          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mb-4 h-48 w-full rounded-xl object-cover" />
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#34302C] bg-[#292521] px-4 py-2 text-sm font-medium text-[#F5F1E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#C2526A] px-4 py-2 text-sm font-semibold text-[#121212] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const isOwnProfile = !userId || String(userId) === String(currentUser?.id);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [gridColumns, setGridColumns] = useState(() => {
    const saved = localStorage.getItem(PROFILE_LAYOUT_STORAGE_KEY);
    if (saved && LAYOUT_SEQUENCE.includes(Number(saved))) return Number(saved);
    return 3;
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get(isOwnProfile ? '/profile/me' : `/profile/${userId}`);
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOwnProfile, userId]);

  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const endpoint = isOwnProfile ? '/posts/me?page=0&size=20' : `/posts/user/${userId}?page=0&size=20`;
        const response = await api.get(endpoint);
        setPosts(response.data?.content ?? response.data ?? []);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [isOwnProfile, userId]);

  useEffect(() => {
    const fetchFriendsPreview = async () => {
      try {
        const response = await api.get('/friends?page=0&size=6');
        setFriends(response.data?.content ?? response.data ?? []);
      } catch (error) {
        console.error('Failed to load friends preview:', error);
      }
    };

    if (isOwnProfile) {
      fetchFriendsPreview();
    }
  }, [isOwnProfile]);

  useEffect(() => {
    localStorage.setItem(PROFILE_LAYOUT_STORAGE_KEY, String(gridColumns));
  }, [gridColumns]);

  const cycleGridColumns = () => {
    const currentIndex = LAYOUT_SEQUENCE.indexOf(gridColumns);
    const nextValue = LAYOUT_SEQUENCE[(currentIndex + 1) % LAYOUT_SEQUENCE.length];
    setGridColumns(nextValue);
  };

  const stats = useMemo(() => {
    const friendCount = profile?.friendsCount ?? profile?.friendCount ?? friends.length ?? 0;
    const roomCount = profile?.roomsCount ?? profile?.roomCount ?? 0;
    const postCount = posts.length ?? 0;

    return [
      { label: 'Friends', value: friendCount },
      { label: 'Rooms', value: roomCount },
      { label: 'Posts', value: postCount },
    ];
  }, [friends.length, posts.length, profile]);

  const gridClass = useMemo(() => {
    const map = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    };

    return map[gridColumns] ?? 'grid-cols-3';
  }, [gridColumns]);

  const privacyLevel = profile?.privacy === 'PRIVATE' || profile?.privacy?.name === 'PRIVATE';
  const displayName = profile?.name || profile?.username || 'User';

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-[#121212] text-[#A9A198]">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24 text-[#F5F1E8]">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(isOwnProfile ? '/home' : '/friends')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#A9A198] transition-colors hover:text-[#F5F1E8]"
        >
          <ArrowLeft className="h-4 w-4" />
          {isOwnProfile ? 'Back to home' : 'Back to friends'}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#34302C] bg-[#211E1B]">
        <div className="h-32 bg-gradient-to-r from-[#C2526A] via-[#D46B82] to-[#7D2639]" />

        <div className="px-5 pb-6 pt-0 md:px-8">
          <div className="-mt-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#211E1B] bg-[#292521] text-3xl font-bold text-[#C2526A] md:h-32 md:w-32">
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-[#F5F1E8]">{displayName}</h1>
                <p className="text-sm text-[#A9A198]">@{profile?.username ?? currentUser?.username ?? 'user'}</p>
              </div>
            </div>

            {isOwnProfile ? (
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#C2526A] bg-[#C2526A] px-4 py-2 text-sm font-semibold text-[#121212] transition-colors hover:bg-[#D46B82]"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#34302C] bg-[#292521] px-4 py-2 text-sm font-medium text-[#F5F1E8] transition-colors hover:bg-[#34302C]"
                  onClick={() => navigate('/friends')}
                >
                  <UserPlus className="h-4 w-4" />
                  Friends
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#34302C] bg-[#292521] px-4 py-2 text-sm font-medium text-[#F5F1E8] transition-colors hover:bg-[#34302C]"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </button>
              </div>
            )}
          </div>

          <p className="mt-5 max-w-2xl text-[#A9A198]">{profile?.bio || 'No bio yet.'}</p>

          <div className="mt-6 grid gap-3 border-y border-[#34302C] py-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[#34302C] bg-[#121212] p-3 text-center">
                <div className="text-2xl font-bold text-[#F5F1E8]">{stat.value}</div>
                <div className="text-xs uppercase tracking-[0.12em] text-[#A9A198]">{stat.label}</div>
              </div>
            ))}
          </div>

          {privacyLevel && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#34302C] bg-[#121212] px-3 py-1.5 text-sm text-[#A9A198]">
              <Lock className="h-4 w-4 text-[#C2526A]" />
              Private profile
            </div>
          )}

          {friends.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#F5F1E8]">Friends</h2>
                <button
                  type="button"
                  onClick={() => navigate('/friends')}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#C2526A] transition-colors hover:text-[#D46B82]"
                >
                  View all
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {friends.slice(0, 6).map((friend) => (
                  <button
                    key={friend.userId ?? friend.id}
                    type="button"
                    onClick={() => navigate(`/profile/${friend.userId ?? friend.id}`)}
                    className="flex items-center gap-2 rounded-xl border border-[#34302C] bg-[#121212] px-3 py-2 text-left transition-colors hover:bg-[#292521]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#292521] text-xs font-semibold text-[#C2526A]">
                      {(friend.username ?? friend.name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-[#F5F1E8]">@{friend.username ?? friend.name ?? 'user'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[#34302C] bg-[#211E1B] p-4 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#C2526A]" />
            <h2 className="text-2xl font-semibold text-[#F5F1E8]">Posts</h2>
          </div>

          <div className="flex items-center gap-3">
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setCreatePostOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#C2526A] bg-[#C2526A] px-3 py-2 text-sm font-semibold text-[#121212] transition-colors hover:bg-[#D46B82]"
              >
                <Plus className="h-4 w-4" />
                Create Post
              </button>
            )}

            <button
              type="button"
              aria-label={`Post grid: ${gridColumns} columns. Click to switch to next layout.`}
              onClick={cycleGridColumns}
              className="inline-flex items-center gap-2 rounded-xl border border-[#34302C] bg-[#121212] px-3 py-2 text-sm font-medium text-[#F5F1E8] transition-colors hover:bg-[#292521]"
            >
              <Grid2x2 className="h-4 w-4 text-[#C2526A]" />
              {gridColumns}
            </button>
          </div>
        </div>

        {postsLoading ? (
          <div className="rounded-xl border border-[#34302C] bg-[#121212] p-8 text-center text-[#A9A198]">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#34302C] bg-[#121212] p-12 text-center text-[#A9A198]">
            <p className="mb-4 text-lg text-[#F5F1E8]">No posts yet.</p>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setCreatePostOpen(true)}
                className="rounded-xl bg-[#C2526A] px-4 py-2 text-sm font-semibold text-[#121212] transition-colors hover:bg-[#D46B82]"
              >
                Create Post
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-3 ${gridClass}`}>
            {posts.map((post) => {
              const media = post.media?.[0];
              const hasVideo = media?.mediaType === 'VIDEO';

              return (
                <div
                  key={post.id ?? post.postId}
                  className="group overflow-hidden rounded-xl border border-[#34302C] bg-[#121212] text-left transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#C2526A]"
                >
                  {media ? (
                    <div className="relative aspect-square overflow-hidden bg-[#211E1B]">
                      {hasVideo ? (
                        <video src={media.mediaUrl} className="h-full w-full object-cover" muted playsInline />
                      ) : (
                        <img src={media.mediaUrl} alt={post.caption ?? 'Post media'} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-[#121212] p-4 text-center text-sm text-[#A9A198]">
                      {post.caption || 'No preview'}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-[#34302C] bg-[#181614] px-3 py-2 text-xs text-[#A9A198]">
                    <span className="truncate">{post.caption ? post.caption.slice(0, 28) : 'Post'}</span>
                    <span className="inline-flex items-center gap-1">
                      {post.privacy === 'PRIVATE' ? <Lock className="h-3 w-3" /> : <span>•</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={async () => {
          const response = await api.get(isOwnProfile ? '/posts/me?page=0&size=20' : `/posts/user/${userId}?page=0&size=20`);
          setPosts(response.data?.content ?? response.data ?? []);
        }}
      />
    </div>
  );
};

export default ProfilePage;
