import { supabase } from "./supabase";
import { User } from "@/types";

export const serviceProvidersService = {
  // Buscar todos os prestadores de serviço
  async getServiceProviders(): Promise<User[]> {
    const { data, error } = await supabase
      .from("user")
      .select(
        "id, name, email, phone, tipo, location, service_types, rating, avatar_url, created_at, updated_at"
      )
      .eq("tipo", "prestador")
      .order("name");

    if (error) {
      console.error("Erro ao buscar prestadores:", error);
      throw error;
    }

    // Garantir shape completo de User
    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      tipo: u.tipo,
      location: u.location,
      service_types: u.service_types,
      rating: u.rating,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
  },

  // Buscar prestador por ID
  async getServiceProviderById(providerId: string): Promise<User | null> {
    // Se providerId parece um UUID, busca por id; caso contrário, tenta por name ilike
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        providerId
      );

    if (isUuid) {
      const { data, error } = await supabase
        .from("user")
        .select(
          "id, name, email, phone, tipo, location, service_types, rating, avatar_url, created_at, updated_at"
        )
        .eq("id", providerId)
        .eq("tipo", "prestador")
        .single();

      if (error) {
        console.error("Erro ao buscar prestador:", error);
        return null;
      }

      return data as User;
    }

    // Fallback: tentar por nome (slug sem hífens para espaços)
    const nameGuess = providerId.replace(/-/g, " ");
    const { data, error } = await supabase
      .from("user")
      .select(
        "id, name, email, phone, tipo, location, service_types, rating, avatar_url, created_at, updated_at"
      )
      .eq("tipo", "prestador")
      .ilike("name", `%${nameGuess}%`)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar prestador (fallback por nome):", error);
      return null;
    }

    return (data as User) ?? null;
  },

  // Buscar prestadores por tipo de serviço
  async getServiceProvidersByType(serviceType: string): Promise<User[]> {
    const { data, error } = await supabase
      .from("user")
      .select(
        "id, name, email, phone, tipo, location, service_types, rating, avatar_url, created_at, updated_at"
      )
      .eq("tipo", "prestador")
      .contains("service_types", [serviceType])
      .order("name");

    if (error) {
      console.error("Erro ao buscar prestadores por tipo:", error);
      throw error;
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      tipo: u.tipo,
      location: u.location,
      service_types: u.service_types,
      rating: u.rating,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
  },
};
