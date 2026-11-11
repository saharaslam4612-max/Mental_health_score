import joblib
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

from sklearn.preprocessing import (
    FunctionTransformer,
    StandardScaler,
    OrdinalEncoder,
    OneHotEncoder
)

import numpy as np
import pandas as pd


df = pd.read_excel(
    r"C:\Users\Hp\Videos\Downloads\Student Social Media And Mental Health Impact.xlsx"
)


df['Country'] = df['Country'].replace('Other', 'Pakistan')

top_countries = df['Country'].value_counts().index[:10].tolist()
print(top_countries)

def countries(country, top_countries):
    if country in top_countries:
        return country
    else:
        return 'other'


df['new_column'] = df['Country'].apply(
    lambda country: countries(country, top_countries)
)


skew_pipeline = Pipeline(steps=[
    ('log_transform', FunctionTransformer(np.log1p)),
    ('scale', StandardScaler())
])

plain_numeric_pipeline = Pipeline(steps=[
    ('scale', StandardScaler())
])

ordinal_pipeline = Pipeline(steps=[
    ('encode', OrdinalEncoder(
        categories=[['Low', 'Medium', 'High', 'Very High']]
    ))
])

nominal_pipeline = Pipeline(steps=[
    ('encode', OneHotEncoder(handle_unknown='ignore'))
])


skewed_features = [
    'Avg_Daily_Usage_Hours',
    'Daily_Unlocks'
]

numeric_features = [
    'Age',
    'Study_Hours',
    'Physical_Activity_Hours',
    'Sleep_Hours_Per_Night'

]

ordinal_features = ['Stress_Level']

nominal_features = [
    'Gender',
    'new_column',
    'Academic_Level',
    'Most_Used_Platform',
    'Purpose_Of_Use'
]


X = df.drop(
    ['Mental_Health_Score', 'Country'],
    axis=1
)

y = df['Mental_Health_Score']


X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


preprocessor = ColumnTransformer(transformers=[
    ('skew', skew_pipeline, skewed_features),
    ('numeric', plain_numeric_pipeline, numeric_features),
    ('ordinal', ordinal_pipeline, ordinal_features),
    ('nominal', nominal_pipeline, nominal_features)
])


lr_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', LinearRegression())
])


lr_pipeline.fit(X_train, y_train)


lr_preds = lr_pipeline.predict(X_test)


print("Predictions:")
print(lr_preds)

print("MAE:", mean_absolute_error(y_test, lr_preds))
print("RMSE:", np.sqrt(mean_squared_error(y_test, lr_preds)))

joblib.dump(lr_pipeline, 'Mental_Health_Model.pkl')
['Mental_Health_Model.pkl']

model = joblib.load("Mental_Health_Model.pkl")
print(type(model))
