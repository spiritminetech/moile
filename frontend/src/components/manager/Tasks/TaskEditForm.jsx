import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  TimePicker, 
  InputNumber,
  Button,
  Row,
  Col,
  message,
  DatePicker
} from 'antd';
import { managerTaskApi } from '../../../api/manager/managerTaskApi';
import { useAuth } from '../../../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;

const TaskEditForm = ({ task, onTaskUpdated, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [trades, setTrades] = useState([]);
  const [tools, setTools] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadMasterData();
    populateForm();
  }, [task]);

  const loadMasterData = async () => {
    try {
      const response = await managerTaskApi.getMasterData(user?.companyId);
      if (response.data.success) {
        const { projects, trades, tools } = response.data.data;
        setProjects(projects);
        setTrades(trades);
        setTools(tools);
      }
    } catch (error) {
      message.error('Failed to load master data');
    }
  };

  const populateForm = () => {
    if (task) {
      const formData = {
        projectId: task.projectId,
        taskName: task.taskName,
        tradeId: task.additionalData?.tradeId,
        workLocation: task.additionalData?.workLocation || '',
        startTime: task.additionalData?.startTime ? dayjs(task.additionalData.startTime, 'HH:mm') : null,
        endTime: task.additionalData?.endTime ? dayjs(task.additionalData.endTime, 'HH:mm') : null,
        requiredManpower: task.additionalData?.requiredManpower || 0,
        requiredTools: task.additionalData?.requiredTools?.map(tool => tool.toolId) || [],
        description: task.description || '',
        status: task.status,
        taskDate: task.additionalData?.taskDate ? dayjs(task.additionalData.taskDate) : (task.startDate ? dayjs(task.startDate) : null)
      };
      
      form.setFieldsValue(formData);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const taskData = {
        ...values,
        startTime: values.startTime ? values.startTime.format('HH:mm') : '',
        endTime: values.endTime ? values.endTime.format('HH:mm') : '',
        taskDate: values.taskDate ? values.taskDate.format('YYYY-MM-DD') : '',
        requiredTools: values.requiredTools?.map(toolId => {
          const tool = tools.find(t => t.id === toolId);
          return {
            toolId: toolId,
            name: tool?.name || 'Unknown Tool',
            qty: 1
          };
        }) || []
      };

      await managerTaskApi.updateTask(task.id, taskData);
      if (onTaskUpdated) onTaskUpdated();
    } catch (error) {
      message.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={`Edit Task - ${task?.taskName || 'Unknown Task'}`}
      className="max-w-2xl mx-auto"
      extra={
        <div className="text-sm text-gray-500">
          Task ID: T{String(task?.id || 0).padStart(3, '0')}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="projectId"
              label="Project"
              rules={[{ required: true, message: 'Please select a project' }]}
            >
              <Select placeholder="Select Project">
                {projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.projectName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="taskDate"
              label="Task Date"
            >
              <DatePicker
                format="DD-MMM-YY"
                style={{ width: '100%' }}
                placeholder="Select date"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select Status">
                <Option value="PLANNED">Planned</Option>
                <Option value="IN_PROGRESS">In Progress</Option>
                <Option value="COMPLETED">Completed</Option>
                <Option value="CANCELLED">Cancelled</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="taskName"
          label="Task Name"
          rules={[{ required: true, message: 'Please enter task name' }]}
        >
          <Input placeholder="Enter task name" />
        </Form.Item>

        <Form.Item
          name="tradeId"
          label="Trade/Work Type"
          rules={[{ required: true, message: 'Please select trade/work type' }]}
        >
          <Select placeholder="Select Trade/Work Type">
            {trades.map(trade => (
              <Option key={trade.id} value={trade.id}>
                {trade.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="workLocation"
          label="Work Location"
        >
          <Input placeholder="Level ___ / Area ___" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label="Start Time"
            >
              <TimePicker
                format="HH:mm"
                placeholder="HH:MM"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endTime"
              label="End Time"
            >
              <TimePicker
                format="HH:mm"
                placeholder="HH:MM"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="requiredManpower"
          label="Required Manpower"
        >
          <InputNumber
            min={0}
            placeholder="Number of workers"
            style={{ width: '100%' }}
            addonAfter="Workers"
          />
        </Form.Item>

        <Form.Item
          name="requiredTools"
          label="Required Tools/Equipment"
        >
          <Select
            mode="multiple"
            placeholder="Select required tools"
            optionLabelProp="label"
          >
            {tools.map(tool => (
              <Option key={tool.id} value={tool.id} label={tool.name}>
                {tool.name} {tool.category && `(${tool.category})`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea
            rows={3}
            placeholder="Enter task description"
          />
        </Form.Item>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
          >
            Update Task
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default TaskEditForm;