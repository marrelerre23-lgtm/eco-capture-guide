-- Create trigger to automatically sync captures_count in profiles table
-- This ensures captures_count always matches the actual number of species_captures

CREATE OR REPLACE FUNCTION sync_captures_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles 
    SET captures_count = captures_count + 1
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles 
    SET captures_count = GREATEST(0, captures_count - 1)
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on species_captures table
DROP TRIGGER IF EXISTS sync_captures_count_trigger ON species_captures;

CREATE TRIGGER sync_captures_count_trigger
AFTER INSERT OR DELETE ON species_captures
FOR EACH ROW
EXECUTE FUNCTION sync_captures_count();