export interface SampleDatasetInfo {
  name: string;
  filename: string;
  description: string;
  tags: string[];
  data: Record<string, any>[];
}

export const SAMPLE_DATASETS: SampleDatasetInfo[] = [
  {
    name: 'Titanic Passengers (Default)',
    filename: 'titanic.csv',
    description: 'Classic dataset with missing ages, high-missing Cabin column (>70%), skewed fares, and categorical data.',
    tags: ['Missing Imputation', 'Column Dropping', 'Skewness & Outliers'],
    data: [
      { PassengerId: 1, Survived: 0, Pclass: 3, Name: 'Braund, Mr. Owen Harris', Sex: 'male', Age: 22, SibSp: 1, Parch: 0, Fare: 7.25, Cabin: null, Embarked: 'S' },
      { PassengerId: 2, Survived: 1, Pclass: 1, Name: 'Cumings, Mrs. John Bradley (Florence Briggs Thayer)', Sex: 'female', Age: 38, SibSp: 1, Parch: 0, Fare: 71.28, Cabin: 'C85', Embarked: 'C' },
      { PassengerId: 3, Survived: 1, Pclass: 3, Name: 'Heikkinen, Miss. Laina', Sex: 'female', Age: 26, SibSp: 0, Parch: 0, Fare: 7.925, Cabin: null, Embarked: 'S' },
      { PassengerId: 4, Survived: 1, Pclass: 1, Name: 'Futrelle, Mrs. Jacques Heath (Lily May Peel)', Sex: 'female', Age: 35, SibSp: 1, Parch: 0, Fare: 53.1, Cabin: 'C123', Embarked: 'S' },
      { PassengerId: 5, Survived: 0, Pclass: 3, Name: 'Allen, Mr. William Henry', Sex: 'male', Age: 35, SibSp: 0, Parch: 0, Fare: 8.05, Cabin: null, Embarked: 'S' },
      { PassengerId: 6, Survived: 0, Pclass: 3, Name: 'Moran, Mr. James', Sex: 'male', Age: null, SibSp: 0, Parch: 0, Fare: 8.4583, Cabin: null, Embarked: 'Q' },
      { PassengerId: 7, Survived: 0, Pclass: 1, Name: 'McCarthy, Mr. Timothy J', Sex: 'male', Age: 54, SibSp: 0, Parch: 0, Fare: 51.8625, Cabin: 'E46', Embarked: 'S' },
      { PassengerId: 8, Survived: 0, Pclass: 3, Name: 'Palsson, Master. Gosta Leonard', Sex: 'male', Age: 2, SibSp: 3, Parch: 1, Fare: 21.075, Cabin: null, Embarked: 'S' },
      { PassengerId: 9, Survived: 1, Pclass: 3, Name: 'Johnson, Mrs. Oscar W (Elisabeth Vilhelmina Berg)', Sex: 'female', Age: 27, SibSp: 0, Parch: 2, Fare: 11.1333, Cabin: null, Embarked: 'S' },
      { PassengerId: 10, Survived: 1, Pclass: 2, Name: 'Nasser, Mrs. Nicholas (Adele Achem)', Sex: 'female', Age: 14, SibSp: 1, Parch: 0, Fare: 30.0708, Cabin: null, Embarked: 'C' },
      { PassengerId: 11, Survived: 1, Pclass: 3, Name: 'Sandstrom, Miss. Marguerite Rut', Sex: 'female', Age: 4, SibSp: 1, Parch: 1, Fare: 16.7, Cabin: 'G6', Embarked: 'S' },
      { PassengerId: 12, Survived: 1, Pclass: 1, Name: 'Bonnell, Miss. Elizabeth', Sex: 'female', Age: 58, SibSp: 0, Parch: 0, Fare: 26.55, Cabin: 'C103', Embarked: 'S' },
      { PassengerId: 13, Survived: 0, Pclass: 3, Name: 'Saundercock, Mr. William Henry', Sex: 'male', Age: 20, SibSp: 0, Parch: 0, Fare: 8.05, Cabin: null, Embarked: 'S' },
      { PassengerId: 14, Survived: 0, Pclass: 3, Name: 'Andersson, Mr. Anders Johan', Sex: 'male', Age: 39, SibSp: 1, Parch: 5, Fare: 31.275, Cabin: null, Embarked: 'S' },
      { PassengerId: 15, Survived: 0, Pclass: 3, Name: 'Vestrom, Miss. Hulda Amanda Adolfina', Sex: 'female', Age: 14, SibSp: 0, Parch: 0, Fare: 7.8542, Cabin: null, Embarked: 'S' },
      { PassengerId: 16, Survived: 1, Pclass: 2, Name: 'Hewlett, Mrs. (Mary D Kingcome) ', Sex: 'female', Age: 55, SibSp: 0, Parch: 0, Fare: 16.0, Cabin: null, Embarked: 'S' },
      { PassengerId: 17, Survived: 0, Pclass: 3, Name: 'Rice, Master. Eugene', Sex: 'male', Age: 2, SibSp: 4, Parch: 1, Fare: 29.125, Cabin: null, Embarked: 'Q' },
      { PassengerId: 18, Survived: 1, Pclass: 2, Name: 'Williams, Mr. Charles Eugene', Sex: 'male', Age: null, SibSp: 0, Parch: 0, Fare: 13.0, Cabin: null, Embarked: 'S' },
      { PassengerId: 19, Survived: 0, Pclass: 3, Name: 'Vander Planke, Mrs. Julius (Emelia Maria Vandemoortele)', Sex: 'female', Age: 31, SibSp: 1, Parch: 0, Fare: 18.0, Cabin: null, Embarked: 'S' },
      { PassengerId: 20, Survived: 1, Pclass: 3, Name: 'Masselmani, Mrs. Fatima', Sex: 'female', Age: null, SibSp: 0, Parch: 0, Fare: 7.225, Cabin: null, Embarked: 'C' },
      { PassengerId: 21, Survived: 0, Pclass: 2, Name: 'Fynney, Mr. Joseph J', Sex: 'male', Age: 35, SibSp: 0, Parch: 0, Fare: 26.0, Cabin: null, Embarked: 'S' },
      { PassengerId: 22, Survived: 1, Pclass: 2, Name: 'Beesley, Mr. Lawrence', Sex: 'male', Age: 34, SibSp: 0, Parch: 0, Fare: 13.0, Cabin: 'D56', Embarked: 'S' },
      { PassengerId: 23, Survived: 1, Pclass: 3, Name: 'McGowan, Miss. Anna "Annie"', Sex: 'female', Age: 15, SibSp: 0, Parch: 0, Fare: 8.0292, Cabin: null, Embarked: 'Q' },
      { PassengerId: 24, Survived: 1, Pclass: 1, Name: 'Sloper, Mr. William Thompson', Sex: 'male', Age: 28, SibSp: 0, Parch: 0, Fare: 35.5, Cabin: 'A6', Embarked: 'S' },
      { PassengerId: 25, Survived: 0, Pclass: 3, Name: 'Palsson, Miss. Torborg Danira', Sex: 'female', Age: 8, SibSp: 3, Parch: 1, Fare: 21.075, Cabin: null, Embarked: 'S' },
      { PassengerId: 26, Survived: 1, Pclass: 3, Name: 'Asplund, Mrs. Carl Oscar (Selma Augusta Emilia Johansson)', Sex: 'female', Age: 38, SibSp: 1, Parch: 5, Fare: 31.3875, Cabin: null, Embarked: 'S' },
      { PassengerId: 27, Survived: 0, Pclass: 1, Name: 'Fortune, Mr. Charles Alexander', Sex: 'male', Age: 19, SibSp: 3, Parch: 2, Fare: 263.0, Cabin: 'C23 C25 C27', Embarked: 'S' },
      { PassengerId: 28, Survived: 0, Pclass: 1, Name: 'Fortune, Mr. Mark', Sex: 'male', Age: 64, SibSp: 1, Parch: 4, Fare: 263.0, Cabin: 'C23 C25 C27', Embarked: 'S' },
      { PassengerId: 29, Survived: 1, Pclass: 1, Name: 'Ward, Miss. Anna', Sex: 'female', Age: 35, SibSp: 0, Parch: 0, Fare: 512.3292, Cabin: null, Embarked: 'C' },
      { PassengerId: 30, Survived: 1, Pclass: 1, Name: 'Cardeza, Mr. Thomas Drake Martinez', Sex: 'male', Age: 36, SibSp: 0, Parch: 1, Fare: 512.3292, Cabin: 'B51 B53 B55', Embarked: 'C' },
      { PassengerId: 31, Survived: 0, Pclass: 3, Name: 'Todoroff, Mr. Lalio', Sex: 'male', Age: null, SibSp: 0, Parch: 0, Fare: 7.8958, Cabin: null, Embarked: 'S' },
      { PassengerId: 32, Survived: 0, Pclass: 1, Name: 'Uruchurtu, Don. Manuel E', Sex: 'male', Age: 40, SibSp: 0, Parch: 0, Fare: 27.7208, Cabin: null, Embarked: 'C' },
      { PassengerId: 33, Survived: 1, Pclass: 3, Name: 'Icard, Miss. Amelie', Sex: 'female', Age: 38, SibSp: 0, Parch: 0, Fare: 80.0, Cabin: 'B28', Embarked: null },
      { PassengerId: 34, Survived: 0, Pclass: 2, Name: 'Wheadon, Mr. Edward H', Sex: 'male', Age: 66, SibSp: 0, Parch: 0, Fare: 10.5, Cabin: null, Embarked: 'S' },
      { PassengerId: 35, Survived: 0, Pclass: 2, Name: 'Meyer, Mr. August', Sex: 'male', Age: 39, SibSp: 0, Parch: 0, Fare: 13.0, Cabin: null, Embarked: 'S' },
      // Duplicate row to test deduplication step
      { PassengerId: 35, Survived: 0, Pclass: 2, Name: 'Meyer, Mr. August', Sex: 'male', Age: 39, SibSp: 0, Parch: 0, Fare: 13.0, Cabin: null, Embarked: 'S' }
    ]
  },
  {
    name: 'Real Estate & Housing',
    filename: 'housing_prices.csv',
    description: 'Home sales features with strong correlations (sqft vs price), skewed price distribution, and missing garage specs.',
    tags: ['Correlation Analysis', 'Z-Score Detection', 'Numerical EDA'],
    data: [
      { HouseId: 101, SquareFeet: 1450, Bedrooms: 3, Bathrooms: 2, YearBuilt: 1998, LotSize: 5200, Price: 310000, Garage: 2 },
      { HouseId: 102, SquareFeet: 2100, Bedrooms: 4, Bathrooms: 2.5, YearBuilt: 2005, LotSize: 7400, Price: 460000, Garage: 2 },
      { HouseId: 103, SquareFeet: 1200, Bedrooms: 2, Bathrooms: 1, YearBuilt: 1978, LotSize: 4800, Price: 225000, Garage: 1 },
      { HouseId: 104, SquareFeet: 3400, Bedrooms: 5, Bathrooms: 3.5, YearBuilt: 2018, LotSize: 11000, Price: 850000, Garage: 3 },
      { HouseId: 105, SquareFeet: 1850, Bedrooms: 3, Bathrooms: 2, YearBuilt: 2002, LotSize: 6200, Price: 395000, Garage: 2 },
      { HouseId: 106, SquareFeet: 950, Bedrooms: 2, Bathrooms: 1, YearBuilt: 1965, LotSize: 3500, Price: 180000, Garage: null },
      { HouseId: 107, SquareFeet: 2750, Bedrooms: 4, Bathrooms: 3, YearBuilt: 2012, LotSize: 8900, Price: 615000, Garage: 2 },
      { HouseId: 108, SquareFeet: 1600, Bedrooms: 3, Bathrooms: 2, YearBuilt: 1995, LotSize: 5600, Price: 340000, Garage: 2 },
      { HouseId: 109, SquareFeet: 2250, Bedrooms: 4, Bathrooms: 2.5, YearBuilt: 2008, LotSize: 7800, Price: 495000, Garage: 2 },
      { HouseId: 110, SquareFeet: 4200, Bedrooms: 5, Bathrooms: 4, YearBuilt: 2021, LotSize: 15000, Price: 1290000, Garage: 3 },
      { HouseId: 111, SquareFeet: 1350, Bedrooms: 3, Bathrooms: 1.5, YearBuilt: 1985, LotSize: 5000, Price: 275000, Garage: 1 },
      { HouseId: 112, SquareFeet: 2900, Bedrooms: 4, Bathrooms: 3, YearBuilt: 2015, LotSize: 9200, Price: 680000, Garage: 3 },
      { HouseId: 113, SquareFeet: 1750, Bedrooms: 3, Bathrooms: 2, YearBuilt: null, LotSize: 5900, Price: 370000, Garage: 2 },
      { HouseId: 114, SquareFeet: 5100, Bedrooms: 6, Bathrooms: 5, YearBuilt: 2022, LotSize: 22000, Price: 1750000, Garage: 4 },
      { HouseId: 115, SquareFeet: 1100, Bedrooms: 2, Bathrooms: 1, YearBuilt: 1972, LotSize: 4200, Price: 210000, Garage: null }
    ]
  },
  {
    name: 'Tech Employee Compensation',
    filename: 'employee_salaries.csv',
    description: 'Workforce analytics data with years of experience, performance ratings, department categories, and bonus distributions.',
    tags: ['Workforce EDA', 'Categorical Handling', 'IQR Outliers'],
    data: [
      { EmpId: 'E001', Department: 'Engineering', ExperienceYears: 2, EducationLevel: 'Bachelors', PerformanceScore: 82, Salary: 72000, Bonus: 5000 },
      { EmpId: 'E002', Department: 'Engineering', ExperienceYears: 6, EducationLevel: 'Masters', PerformanceScore: 91, Salary: 115000, Bonus: 14000 },
      { EmpId: 'E003', Department: 'Marketing', ExperienceYears: 4, EducationLevel: 'Bachelors', PerformanceScore: 78, Salary: 68000, Bonus: 4500 },
      { EmpId: 'E004', Department: 'Sales', ExperienceYears: 8, EducationLevel: 'Bachelors', PerformanceScore: 88, Salary: 95000, Bonus: 22000 },
      { EmpId: 'E005', Department: 'Engineering', ExperienceYears: 12, EducationLevel: 'PhD', PerformanceScore: 95, Salary: 168000, Bonus: 28000 },
      { EmpId: 'E006', Department: 'HR', ExperienceYears: 3, EducationLevel: 'Bachelors', PerformanceScore: 74, Salary: 58000, Bonus: 3000 },
      { EmpId: 'E007', Department: 'Sales', ExperienceYears: 5, EducationLevel: 'Bachelors', PerformanceScore: null, Salary: 82000, Bonus: 16000 },
      { EmpId: 'E008', Department: 'Engineering', ExperienceYears: 15, EducationLevel: 'Masters', PerformanceScore: 97, Salary: 195000, Bonus: 35000 },
      { EmpId: 'E009', Department: 'Marketing', ExperienceYears: 9, EducationLevel: 'Masters', PerformanceScore: 89, Salary: 102000, Bonus: 12500 },
      { EmpId: 'E010', Department: 'Product', ExperienceYears: 7, EducationLevel: 'Masters', PerformanceScore: 92, Salary: 128000, Bonus: 18000 },
      { EmpId: 'E011', Department: 'Executive', ExperienceYears: 22, EducationLevel: 'MBA', PerformanceScore: 99, Salary: 340000, Bonus: 110000 }
    ]
  }
];
