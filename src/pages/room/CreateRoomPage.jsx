
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Users,
  ShieldCheck,
  Lock,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { ROOM_TYPES } from '../../config/constants';
import api from '../../services/api';

const ROOM_TYPE_OPTIONS = [
  {
    value: ROOM_TYPES.PUBLIC,
    label: 'Public',
    description: 'Anyone who can discover the room can join.',
    Icon: Globe,
  },
  {
    value: ROOM_TYPES.FRIENDS,
    label: 'Friends',
    description: 'Friends of the current leader can join according to backend rules.',
    Icon: Users,
  },
  {
    value: ROOM_TYPES.APPROVAL_REQUIRED,
    label: 'Approval Required',
    description: 'People can request to join and approval is required.',
    Icon: ShieldCheck,
  },
  {
    value: ROOM_TYPES.PRIVATE,
    label: 'Private',
    description: 'The room is restricted and invite-based according to backend rules.',
    Icon: Lock,
  },
];

const MAX_LENGTHS = {
  name: 100,
  description: 500,
};

const CreateRoomPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: ROOM_TYPES.PUBLIC,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: '',
      submit: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      nextErrors.name = 'Room name is required.';
    } else if (trimmedName.length > MAX_LENGTHS.name) {
      nextErrors.name = `Room name must be ${MAX_LENGTHS.name} characters or fewer.`;
    }

    if (formData.description.trim().length > MAX_LENGTHS.description) {
      nextErrors.description = `Description must be ${MAX_LENGTHS.description} characters or fewer.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
    };

    const description = formData.description.trim();
    if (description) {
      payload.description = description;
    }

    try {
      const response = await api.post('/rooms', payload);
      const roomId = response.data?.roomId ?? response.data?.id;

      if (!roomId) {
        setErrors({
          submit: 'Room was created, but the server did not return a room ID.',
        });
        return;
      }

      navigate(`/rooms/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);

      let message = 'Unable to create room right now. Please try again.';

      if (error.response?.status === 401) {
        message = 'Your session has expired. Please log in again.';
      } else if (error.response?.status === 403) {
        message = 'You are not allowed to create a room.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message === 'Network Error') {
        message = 'Network error. Check your connection and try again.';
      }

      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F1E8]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#A9A198] transition-colors hover:text-[#F5F1E8]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rooms
        </button>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#34302C] bg-[#211E1B] shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <div className="border-b border-[#34302C] p-6 sm:p-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C2526A]/30 bg-[#292521] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#C2526A]">
              <Sparkles className="h-3.5 w-3.5" />
              Create Room
            </div>
            <h1 className="text-3xl font-bold text-[#F5F1E8]">Create a Room</h1>
            <p className="mt-2 text-base text-[#A9A198]">
              Give your room a name and decide who can join.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="room-name" className="mb-2 block text-sm font-medium text-[#F5F1E8]">
                  Room name
                </label>
                <input
                  id="room-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Late Night Music"
                  maxLength={MAX_LENGTHS.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'room-name-error' : undefined}
                  className={`w-full rounded-xl border bg-[#121212] px-4 py-3 text-base text-[#F5F1E8] placeholder:text-[#A9A198] transition-colors focus:border-[#C2526A] focus:outline-none ${
                    errors.name ? 'border-[#D96565]' : 'border-[#34302C]'
                  }`}
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#A9A198]">
                  <span>{errors.name ? <span id="room-name-error" className="text-[#D96565]">{errors.name}</span> : 'Required'}</span>
                  <span>{formData.name.length}/{MAX_LENGTHS.name}</span>
                </div>
              </div>

              <div>
                <label htmlFor="room-description" className="mb-2 block text-sm font-medium text-[#F5F1E8]">
                  Description
                </label>
                <textarea
                  id="room-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell people what this room is about..."
                  rows={4}
                  maxLength={MAX_LENGTHS.description}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'room-description-error' : undefined}
                  className={`w-full rounded-xl border bg-[#121212] px-4 py-3 text-base text-[#F5F1E8] placeholder:text-[#A9A198] transition-colors focus:border-[#C2526A] focus:outline-none ${
                    errors.description ? 'border-[#D96565]' : 'border-[#34302C]'
                  }`}
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#A9A198]">
                  <span>{errors.description ? <span id="room-description-error" className="text-[#D96565]">{errors.description}</span> : 'Optional'}</span>
                  <span>{formData.description.length}/{MAX_LENGTHS.description}</span>
                </div>
              </div>

              <fieldset>
                <legend className="mb-3 block text-sm font-medium text-[#F5F1E8]">Room type</legend>
                <div className="grid gap-3">
                  {ROOM_TYPE_OPTIONS.map(({ value, label, description, Icon }) => {
                    const checked = formData.type === value;

                    return (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                          checked
                            ? 'border-[#C2526A] bg-[#292521]'
                            : 'border-[#34302C] bg-[#121212] hover:border-[#A9A198]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={value}
                          checked={checked}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg ${checked ? 'bg-[#C2526A] text-[#121212]' : 'bg-[#211E1B] text-[#A9A198]'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-base font-semibold text-[#F5F1E8]">{label}</span>
                          <span className="mt-1 block text-sm text-[#A9A198]">{description}</span>
                        </span>
                        <span className={`mt-1.5 h-4 w-4 rounded-full border-2 ${checked ? 'border-[#C2526A] bg-[#C2526A]' : 'border-[#A9A198]'}`} />
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {errors.submit && (
                <div className="rounded-xl border border-[#D96565]/50 bg-[#2A1717] px-4 py-3 text-sm text-[#F5F1E8]">
                  {errors.submit}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/rooms')}
                  className="sm:min-w-[120px] bg-[#292521] text-[#F5F1E8] hover:bg-[#34302C]"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="sm:min-w-[160px] border border-[#C2526A] bg-[#C2526A] text-[#121212] hover:bg-[#D46B82]"
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;