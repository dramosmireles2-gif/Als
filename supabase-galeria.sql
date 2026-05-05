-- Tabla para fotos de clientas
CREATE TABLE galeria_clientas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  foto_url    TEXT NOT NULL,
  nombre      TEXT,
  descripcion TEXT,
  activa      BOOLEAN DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE galeria_clientas ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "galeria_publica"
  ON galeria_clientas FOR SELECT
  USING (true);

-- Escritura solo admin
CREATE POLICY "galeria_admin"
  ON galeria_clientas FOR ALL
  USING (auth.role() = 'authenticated');
