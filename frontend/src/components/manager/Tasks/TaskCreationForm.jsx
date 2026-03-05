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

const TaskCreationForm = ({ onTaskCreated, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [trades, setTrades] = useState([]);
  const [tools, setTools] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const response = await managerTaskApi.getMasterData(user?.companyId);
      console.log('Master data response:', response.data);
      if (response.data.success) {
        const { projects, trades, tools } = response.data.data;
        console.log('Tools received:', tools);
        setProjects(projects);
        setTrades(trades);
        setTools(tools);
      }
    } catch (error) {
      console.error('Failed to load master data:', error);
      message.error('Failed to load master data');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const taskData = {
        ...values,
        companyId: user?.companyId,
        createdBy: user?.id,
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

      await managerTaskApi.createTask(taskData);
      message.success('Task created successfully');
      form.resetFields();
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      message.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title="Project Manager – Create Task" 
      className="max-w-2xl mx-auto"
      extra={
        <div className="text-sm text-gray-500">
          Date: {dayjs().format('DD-MMM-YY')}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          requiredManpower: 1,
          taskDate: dayjs()
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="projectId"
              label="Project"
              rules={[{ required: true, message: 'Please select a project' }]}
            >
              <Select placeholder="Marina Bay Towers">
                {projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.projectName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="taskDate"
              label="Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker 
                format="DD-MMM-YY"
                style={{ width: '100%' }}
                placeholder="Select date"
              />
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
          <Select placeholder="Painting / Façade / Plumbing">
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
            placeholder="__ Workers"
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
            placeholder="Boom lift, Ladder, etc."
            optionLabelProp="label"
          >
            {tools.map(tool => (
              <Option key={tool.id} value={tool.id} label={tool.name}>
                {tool.name}
              </Option>
            ))}
          </Select>
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
            Create Task
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default TaskCreationForm;