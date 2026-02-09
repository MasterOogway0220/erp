-- Remove dummy terms conditions
TRUNCATE TABLE terms_conditions_library CASCADE;

-- Clear testing standards to ensure only Excel values are used
TRUNCATE TABLE testing_standards CASCADE;
