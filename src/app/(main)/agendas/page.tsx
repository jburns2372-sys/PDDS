import { AgendaCard } from "@/components/agenda-card";
import { agendas } from "@/lib/data";

export default function AgendasPage() {
  return (
    <div className="flex flex-col">
      <div className="bg-card p-6 md:p-8 border-b">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
            Program of Government
          </h1>
          <p className="mt-2 text-muted-foreground">
            Explore the six core pillars of the PDDS agenda for a better nation.
          </p>
        </div>
      </div>
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
          {agendas.map((agenda) => (
            <AgendaCard key={agenda.title} agenda={agenda} />
          ))}
        </div>
      </div>
    </div>
  );
}
