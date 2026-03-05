import React, { useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TaskCreationForm from '../../components/manager/Tasks/TaskCreationForm';
import TaskListView from '../../components/manager/Tasks/TaskListView';
import TaskEditForm from '../../components/manager/Tasks/TaskEditForm';
import { managerTaskApi } from '../../api/manager/managerTaskApi';

const ProjectManagerTasks = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [refreshTasks, setRefreshTasks] = useState(0);

  console.log('ProjectManagerTasks render state:', {
    showCreateForm,
    showEditForm,
    editingTask: !!editingTask
  });

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowCreateForm(true);
  };

  const handleTaskCreated = () => {
    setShowCreateForm(false);
    setRefreshTasks(prev => prev + 1);
    message.success('Task created successfully');
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditForm(true);
  };

  const handleTaskUpdated = () => {
    setShowEditForm(false);
    setEditingTask(null);
    setRefreshTasks(prev => prev + 1);
    message.success('Task updated successfully');
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await managerTaskApi.deleteTask(taskId);
      message.success('Task deleted successfully');
      setRefreshTasks(prev => prev + 1);
    } catch (error) {
      message.error('Failed to delete task');
    }
  };

  const handleViewTask = (task) => {
    // For now, view will open edit form in read-only mode
    setEditingTask(task);
    setShowEditForm(true);
  };

  // Show Create Form
  if (showCreateForm) {
    return (
      <div className="p-6">
        <TaskCreationForm
          onTaskCreated={handleTaskCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  // Show Edit Form
  if (showEditForm && editingTask) {
    return (
      <div className="p-6">
        <TaskEditForm
          task={editingTask}
          onTaskUpdated={handleTaskUpdated}
          onCancel={() => {
            setShowEditForm(false);
            setEditingTask(null);
          }}
        />
      </div>
    );
  }

  // Default: Show Task List View
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Task Management</h1>
            <p className="text-sm text-gray-600">Create and manage project tasks</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
            size="large"
          >
            Create Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <TaskListView
          key={refreshTasks}
          onEditTask={handleEditTask}
          onViewTask={handleViewTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
};

export default ProjectManagerTasks;