import { Card, Button } from "antd";
import { useAuth } from "../context/AuthContext";

const SelectCompany = () => {
  const { companies, selectCompany } = useAuth();

  return (
    <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
      {companies.map((c) => (
        <Card key={c.companyId} title={c.companyName}>
          <p>Role: {c.role}</p>
          <Button type="primary" onClick={() => selectCompany(c.companyId)}>
            Enter Company
          </Button>
        </Card>
      ))}
    </div>
  );
};

export default SelectCompany;
