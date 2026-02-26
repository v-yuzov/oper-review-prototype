export interface EmployeeDto {
  id: number;
  name: string;
  position: string | null;
}

export interface ChildUnitDto {
  id: number;
  name: string;
  managerName: string | null;
}

export interface UnitViewDto {
  id: number;
  name: string;
  parentId: number | null;
  manager: EmployeeDto | null;
  children: ChildUnitDto[];
  employees: EmployeeDto[];
}
