import Task from '../task/TaskModel.js';
import Project from '../project/models/ProjectModel.js';
import Trade from '../trade/TradeModel.js';
import Tool from '../tool/ToolModel.js';
import Company from '../company/CompanyModel.js';

/**
 * Generate next task ID
 */
const generateTaskId = async () => {
  const lastTask = await Task.findOne({}, {}, { sort: { id: -1 } });
  return lastTask ? lastTask.id + 1 : 1;
};

/**
 * GET /api/manager/tasks/master-data - Get master data for task creation
 */
export const getMasterData = async (req, res) => {
  try {
    const { companyId } = req.query;

    console.log('getMasterData called with companyId:', companyId);

    const [projects, trades, tools] = await Promise.all([
      // If companyId is provided and valid, filter by it, otherwise get all projects
      companyId && companyId !== 'undefined' && companyId !== 'null' && companyId !== '' 
        ? Project.find({ companyId: parseInt(companyId) }).select('id projectName projectCode status').sort({ projectName: 1 })
        : Project.find({}).select('id projectName projectCode status').sort({ projectName: 1 }),
      Trade.find({}).select('id name').sort({ name: 1 }),
      Tool.find({}).select('id name category').sort({ name: 1 })
    ]);

    console.log('Master data fetched:', {
      companyId: companyId,
      projectsCount: projects.length,
      tradesCount: trades.length,
      toolsCount: tools.length,
      tools: tools.map(t => ({ id: t.id, name: t.name, category: t.category }))
    });

    res.json({
      success: true,
      data: {
        projects,
        trades,
        tools
      }
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching master data: ${error.message}`
    });
  }
};

/**
 * POST /api/manager/tasks - Create new task
 */
export const createManagerTask = async (req, res) => {
  try {
    const {
      projectId,
      taskName,
      tradeId,
      workLocation,
      startTime,
      endTime,
      requiredManpower,
      requiredTools,
      description,
      companyId,
      createdBy,
      taskDate
    } = req.body;

    // Validation
    if (!taskName || !tradeId) {
      return res.status(400).json({
        success: false,
        message: 'Task name and trade are required'
      });
    }

    // Get trade name
    const trade = await Trade.findOne({ id: tradeId });
    if (!trade) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trade selected'
      });
    }

    // Generate task ID
    const taskId = await generateTaskId();

    // Prepare additional data
    const additionalData = {
      workLocation: workLocation || '',
      requiredManpower: parseInt(requiredManpower) || 0,
      requiredTools: requiredTools || [],
      tradeId: tradeId,
      tradeName: trade.name,
      startTime: startTime || '',
      endTime: endTime || '',
      taskDate: taskDate || ''
    };

    // Create task
    const newTask = new Task({
      id: taskId,
      companyId: companyId ? parseInt(companyId) : undefined,
      projectId: projectId ? parseInt(projectId) : undefined,
      taskName: taskName.trim(),
      taskType: 'WORK',
      description: description?.trim() || '',
      status: 'PLANNED',
      startDate: taskDate ? new Date(taskDate) : new Date(),
      createdBy: createdBy ? parseInt(createdBy) : undefined,
      additionalData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedTask = await newTask.save();

    // Populate response with related data
    const [project, company] = await Promise.all([
      projectId ? Project.findOne({ id: projectId }) : Promise.resolve(null),
      companyId ? Company.findOne({ id: companyId }) : Promise.resolve(null)
    ]);

    const taskResponse = {
      ...savedTask.toObject(),
      projectName: project?.projectName || 'No Project',
      companyName: company?.name || 'No Company',
      tradeName: trade.name
    };

    res.status(201).json({
      success: true,
      data: taskResponse,
      message: 'Task created successfully'
    });

  } catch (error) {
    console.error('Error creating manager task:', error);
    res.status(500).json({
      success: false,
      message: `Error creating task: ${error.message}`
    });
  }
};

/**
 * GET /api/manager/tasks - Get tasks with filters
 */
export const getManagerTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      projectId,
      tradeId,
      status,
      dateFrom,
      dateTo,
      createdBy,
      companyId
    } = req.query;

    // Build query
    const query = {};
    
    // Only filter by companyId if it's provided and not null/undefined
    if (companyId && companyId !== 'undefined' && companyId !== 'null') {
      query.companyId = parseInt(companyId);
    }
    
    if (projectId && projectId !== 'all') query.projectId = parseInt(projectId);
    if (status && status !== 'all') query.status = status.toUpperCase();
    if (createdBy && createdBy !== 'all') query.createdBy = parseInt(createdBy);
    
    // Trade filter (stored in additionalData)
    if (tradeId && tradeId !== 'all') {
      query['additionalData.tradeId'] = parseInt(tradeId);
    }

    // Date range filter
    if (dateFrom && dateTo) {
      query.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo + 'T23:59:59.999Z')
      };
    }

    console.log('Task query:', query);
    console.log('CompanyId from request:', companyId);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get tasks with pagination
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(query)
    ]);

    console.log('Found tasks:', tasks.length, 'Total:', total);

    // Populate related data
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const [project, company, trade] = await Promise.all([
          task.projectId ? Project.findOne({ id: task.projectId }) : Promise.resolve(null),
          task.companyId ? Company.findOne({ id: task.companyId }) : Promise.resolve(null),
          task.additionalData?.tradeId ? Trade.findOne({ id: task.additionalData.tradeId }) : Promise.resolve(null)
        ]);

        return {
          ...task.toObject(),
          projectName: project?.projectName || 'No Project',
          companyName: company?.name || 'No Company',
          tradeName: trade?.name || task.additionalData?.tradeName || 'Unknown Trade'
        };
      })
    );

    res.json({
      success: true,
      data: tasksWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching manager tasks:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching tasks: ${error.message}`
    });
  }
};

/**
 * GET /api/manager/tasks/:id - Get single task
 */
export const getManagerTaskById = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = await Task.findOne({ id: taskId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Populate related data
    const [project, company, trade] = await Promise.all([
      task.projectId ? Project.findOne({ id: task.projectId }) : Promise.resolve(null),
      task.companyId ? Company.findOne({ id: task.companyId }) : Promise.resolve(null),
      task.additionalData?.tradeId ? Trade.findOne({ id: task.additionalData.tradeId }) : Promise.resolve(null)
    ]);

    const taskWithDetails = {
      ...task.toObject(),
      projectName: project?.projectName || 'No Project',
      companyName: company?.name || 'No Company',
      tradeName: trade?.name || task.additionalData?.tradeName || 'Unknown Trade'
    };

    res.json({
      success: true,
      data: taskWithDetails
    });

  } catch (error) {
    console.error('Error fetching manager task:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching task: ${error.message}`
    });
  }
};

/**
 * PUT /api/manager/tasks/:id - Update task
 */
export const updateManagerTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const {
      projectId,
      taskName,
      tradeId,
      workLocation,
      startTime,
      endTime,
      requiredManpower,
      requiredTools,
      description,
      status,
      taskDate
    } = req.body;

    const task = await Task.findOne({ id: taskId });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get trade name if tradeId is provided
    let tradeName = task.additionalData?.tradeName;
    if (tradeId) {
      const trade = await Trade.findOne({ id: tradeId });
      if (trade) {
        tradeName = trade.name;
      }
    }

    // Update fields
    if (projectId !== undefined) task.projectId = projectId ? parseInt(projectId) : undefined;
    if (taskName) task.taskName = taskName.trim();
    if (description !== undefined) task.description = description.trim();
    if (status) task.status = status.toUpperCase();
    if (taskDate) task.startDate = new Date(taskDate);

    // Update additional data
    const updatedAdditionalData = {
      ...task.additionalData,
      workLocation: workLocation !== undefined ? workLocation : task.additionalData?.workLocation || '',
      requiredManpower: requiredManpower !== undefined ? parseInt(requiredManpower) : task.additionalData?.requiredManpower || 0,
      requiredTools: requiredTools !== undefined ? requiredTools : task.additionalData?.requiredTools || [],
      startTime: startTime !== undefined ? startTime : task.additionalData?.startTime || '',
      endTime: endTime !== undefined ? endTime : task.additionalData?.endTime || '',
      taskDate: taskDate !== undefined ? taskDate : task.additionalData?.taskDate || ''
    };

    if (tradeId) {
      updatedAdditionalData.tradeId = tradeId;
      updatedAdditionalData.tradeName = tradeName;
    }

    task.additionalData = updatedAdditionalData;
    task.updatedAt = new Date();

    const updatedTask = await task.save();

    // Populate response
    const [project, company] = await Promise.all([
      updatedTask.projectId ? Project.findOne({ id: updatedTask.projectId }) : Promise.resolve(null),
      updatedTask.companyId ? Company.findOne({ id: updatedTask.companyId }) : Promise.resolve(null)
    ]);

    const taskResponse = {
      ...updatedTask.toObject(),
      projectName: project?.projectName || 'No Project',
      companyName: company?.name || 'No Company',
      tradeName: tradeName || 'Unknown Trade'
    };

    res.json({
      success: true,
      data: taskResponse,
      message: 'Task updated successfully'
    });

  } catch (error) {
    console.error('Error updating manager task:', error);
    res.status(500).json({
      success: false,
      message: `Error updating task: ${error.message}`
    });
  }
};

/**
 * DELETE /api/manager/tasks/:id - Delete task
 */
export const deleteManagerTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const deletedTask = await Task.findOneAndDelete({ id: taskId });

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask
    });

  } catch (error) {
    console.error('Error deleting manager task:', error);
    res.status(500).json({
      success: false,
      message: `Error deleting task: ${error.message}`
    });
  }
};