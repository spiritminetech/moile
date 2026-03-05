import * as AuthService from './authService.js';

export const login = async (req, res) => {
  try{
  const result = await AuthService.login(req.body.email, req.body.password);
  res.json(result);
  }
  catch(error){
    res.status(401).json({message: error.message});
  }

};

export const selectCompany = async (req, res) => {
  const result = await AuthService.selectCompany(
    req.user.userId,
    req.body.companyId
  );
  res.json(result);
};