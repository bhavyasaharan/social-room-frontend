import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

const AdminPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('WARNING');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/moderation/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAction = async () => {
    setSubmitting(true);
    try {
      await api.post('/moderation/actions', {
        reportId: selectedReport.reportId,
        actionType,
        notes
      });
      alert('Action taken successfully');
      setShowActionModal(false);
      setSelectedReport(null);
      setNotes('');
      fetchReports();
    } catch (error) {
      console.error('Failed to take action:', error);
      alert('Failed to take action');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Access denied. Admin or moderator only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading reports...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-rose-900 text-rose-200';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'AWAITING_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Shield className="h-8 w-8 mr-3" />
          Moderation Dashboard
        </h1>
        <Button onClick={fetchReports}>Refresh</Button>
      </div>

      <div className="grid gap-4">
        {reports.length === 0 ? (
          <Card className="p-6">
            <p className="text-gray-500 text-center">No reports to review</p>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.reportId} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="font-semibold text-lg">
                      {report.targetType} - {report.reason.replace(/_/g, ' ')}
                    </p>
                    <p className="text-gray-600 mt-1">{report.description}</p>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Target ID: {report.targetId}</p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowActionModal(true);
                  }}
                  disabled={report.status === 'RESOLVED' || report.status === 'DISMISSED'}
                >
                  Take Action
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Take Moderation Action</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WARNING">Warning</option>
                <option value="CONTENT_REMOVED">Content Removed</option>
                <option value="CONTENT_RESTRICTED">Content Restricted</option>
                <option value="USER_SUSPENDED">User Suspended</option>
                <option value="RECOMMEND_BAN">Recommend Ban</option>
                <option value="USER_BANNED">User Banned</option>
                <option value="DISMISS_REPORT">Dismiss Report</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this action..."
                rows="3"
                maxLength={2000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedReport(null);
                  setNotes('');
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleTakeAction} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Action'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
