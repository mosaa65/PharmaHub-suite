import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Stethoscope,
  AlertTriangle,
  Pill,
  Heart,
  X,
  Sparkles,
  Loader2,
  Plus,
  Brain,
  Send,
  RotateCcw,
  User,
  Bot,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Clock,
  ChevronRight,
} from "lucide-react";

import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  analyzeInteractions,
  recommendDosage,
  smartTriage,
} from "@/lib/clinical.functions";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";


export const Route = createFileRoute("/_authenticated/pharmacist")({
  component: Pharmacist,
});

function severityClass(s: string) {
  if (s === "severe") return "bg-rose-500/15 text-rose-600 border-rose-500/30";
  if (s === "moderate") return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
}

function Pharmacist() {
  const { t, lang } = useI18n();
  const tab = useRouterState({ select: (s) => new URLSearchParams(s.location.searchStr).get("tab") ?? "triage" });
  return (
    <div>
      <PageHeader
        title={t("clinicalTools")}
        icon={<Stethoscope className="h-5 w-5" />}
      />
      <Tabs value={tab} className="space-y-4">
        <TabsList className="bg-card/80 backdrop-blur border border-border/60 p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="triage" className="gap-2 rounded-lg">
            <Brain className="h-4 w-4" /> {t("smartTriage")}
          </TabsTrigger>
          <TabsTrigger value="interactions" className="gap-2 rounded-lg">
            <AlertTriangle className="h-4 w-4" /> {t("interactionChecker")}
          </TabsTrigger>
          <TabsTrigger value="dosage" className="gap-2 rounded-lg">
            <Pill className="h-4 w-4" /> {t("dosageAdvisor")}
          </TabsTrigger>
          <TabsTrigger value="allergy" className="gap-2 rounded-lg">
            <Heart className="h-4 w-4" /> {t("allergyCheck")}
          </TabsTrigger>
          <TabsTrigger value="refill" className="gap-2 rounded-lg">
            <RefreshCw className="h-4 w-4" /> {t("refillTracker")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="triage">
          <SmartTriage lang={lang} />
        </TabsContent>
        <TabsContent value="interactions">
          <InteractionChecker lang={lang} />
        </TabsContent>
        <TabsContent value="dosage">
          <DosageAdvisor lang={lang} />
        </TabsContent>
        <TabsContent value="allergy">
          <AllergyCheck />
        </TabsContent>
        <TabsContent value="refill">
          <RefillTracker />
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        ⚕ {t("disclaimer")}
      </p>
    </div>
  );
}

function InteractionChecker({ lang }: { lang: "ar" | "en" }) {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [drugs, setDrugs] = useState<string[]>([]);
  const analyze = useServerFn(analyzeInteractions);

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!drugs.includes(v)) setDrugs([...drugs, v]);
    setInput("");
  };

  const mut = useMutation({
    mutationFn: async () => analyze({ data: { drugs, lang } }),
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-5 space-y-4 border-border/60">
        <div>
          <Label className="mb-2 block">{t("drugList")}</Label>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
              placeholder={t("drugName")}
            />
            <Button type="button" onClick={add} variant="secondary" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 min-h-10">
            {drugs.map((d) => (
              <Badge
                key={d}
                variant="secondary"
                className="gap-1 py-1.5 px-3 rounded-full"
              >
                {d}
                <button
                  onClick={() => setDrugs(drugs.filter((x) => x !== d))}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <Button
          onClick={() => mut.mutate()}
          disabled={drugs.length < 2 || mut.isPending}
          className="w-full gap-2 gradient-primary"
        >
          {mut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {mut.isPending ? t("analyzing") : t("runCheck")}
        </Button>
      </Card>

      <Card className="p-5 space-y-4 border-border/60 min-h-[18rem]">
        <div>
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t("knownInteractions")}
          </h3>
          {!mut.data?.dbMatches?.length && (
            <p className="text-sm text-muted-foreground">{t("noInteractions")}</p>
          )}
          <div className="space-y-2">
            {mut.data?.dbMatches?.map((m: any) => (
              <div
                key={m.id}
                className={`rounded-xl border p-3 ${severityClass(m.severity)}`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <span>{m.drug_a}</span>
                  <span>↔</span>
                  <span>{m.drug_b}</span>
                  <Badge variant="outline" className="ms-auto text-[10px]">
                    {t(`severity` as any)}: {t(m.severity as any)}
                  </Badge>
                </div>
                {m.description && (
                  <p className="text-xs mt-1 opacity-90">{m.description}</p>
                )}
                {m.recommendation && (
                  <p className="text-xs mt-1 font-medium">→ {m.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        {mut.data?.aiText && (
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("aiAnalysis")}
            </h3>
            <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 rounded-xl bg-muted/50 p-3 border border-border/60">
              {mut.data.aiText}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function DosageAdvisor({ lang }: { lang: "ar" | "en" }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    drug: "",
    age: "",
    weight: "",
    condition: "",
  });
  const rec = useServerFn(recommendDosage);
  const mut = useMutation({
    mutationFn: async () =>
      rec({
        data: {
          drug: form.drug,
          age: form.age ? Number(form.age) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          condition: form.condition || undefined,
          lang,
        },
      }),
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-5 space-y-3 border-border/60">
        <div className="grid gap-3">
          <div>
            <Label>{t("drugName")} *</Label>
            <Input
              value={form.drug}
              onChange={(e) => setForm({ ...form, drug: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("age")}</Label>
              <Input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("weight")}</Label>
              <Input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>{t("condition")}</Label>
            <Input
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            />
          </div>
        </div>
        <Button
          className="w-full gap-2 gradient-primary"
          disabled={!form.drug || mut.isPending}
          onClick={() => mut.mutate()}
        >
          {mut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {mut.isPending ? t("analyzing") : t("getDosage")}
        </Button>
      </Card>
      <Card className="p-5 border-border/60 min-h-[18rem]">
        {mut.data?.text ? (
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {mut.data.text}
          </div>
        ) : (
          <div className="h-full grid place-items-center text-muted-foreground text-sm">
            <div className="text-center">
              <Pill className="h-10 w-10 mx-auto mb-2 opacity-40" />
              {t("dosageAdvisor")}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function AllergyCheck() {
  const { t } = useI18n();
  const [customerId, setCustomerId] = useState<string>("");
  const [input, setInput] = useState("");
  const [drugs, setDrugs] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [severity, setSeverity] = useState("moderate");

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");
      return data ?? [];
    },
  });

  const { data: allergies = [], refetch } = useQuery({
    queryKey: ["allergies", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_allergies")
        .select("*")
        .eq("customer_id", customerId);
      return data ?? [];
    },
  });

  const matches = useMemo(() => {
    if (!drugs.length || !allergies.length) return [];
    return allergies.filter((a: any) =>
      drugs.some(
        (d) =>
          d.toLowerCase().includes(a.allergen.toLowerCase()) ||
          a.allergen.toLowerCase().includes(d.toLowerCase()),
      ),
    );
  }, [drugs, allergies]);

  const addAllergy = async () => {
    if (!customerId || !newAllergy.trim()) return;
    const { error } = await supabase.from("customer_allergies").insert({
      customer_id: customerId,
      allergen: newAllergy.trim(),
      severity,
    });
    if (error) toast.error(error.message);
    else {
      setNewAllergy("");
      refetch();
    }
  };

  const removeAllergy = async (id: string) => {
    await supabase.from("customer_allergies").delete().eq("id", id);
    refetch();
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-5 space-y-4 border-border/60">
        <div>
          <Label className="mb-2 block">{t("selectCustomer")}</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectCustomer")} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {customerId && (
          <div>
            <Label className="mb-2 block">{t("allergies")}</Label>
            <div className="flex gap-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder={t("allergen")}
              />
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">{t("mild")}</SelectItem>
                  <SelectItem value="moderate">{t("moderate")}</SelectItem>
                  <SelectItem value="severe">{t("severe")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addAllergy} size="icon" variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {allergies.map((a: any) => (
                <Badge
                  key={a.id}
                  className={`gap-1 py-1.5 px-3 rounded-full border ${severityClass(a.severity)}`}
                  variant="outline"
                >
                  {a.allergen}
                  <button
                    onClick={() => removeAllergy(a.id)}
                    className="hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="mb-2 block">{t("drugList")}</Label>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = input.trim();
                  if (v && !drugs.includes(v)) setDrugs([...drugs, v]);
                  setInput("");
                }
              }}
              placeholder={t("drugName")}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {drugs.map((d) => (
              <Badge
                key={d}
                variant="secondary"
                className="gap-1 py-1.5 px-3 rounded-full"
              >
                {d}
                <button onClick={() => setDrugs(drugs.filter((x) => x !== d))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5 border-border/60 min-h-[18rem]">
        {!customerId ? (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">
            {t("selectCustomer")}
          </div>
        ) : matches.length ? (
          <div className="space-y-2">
            {matches.map((m: any) => (
              <div
                key={m.id}
                className={`rounded-xl border p-3 ${severityClass(m.severity)}`}
              >
                <div className="font-bold text-sm">
                  ⚠ {t("allergyMatch")}: {m.allergen}
                </div>
                {m.notes && <p className="text-xs mt-1">{m.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full grid place-items-center text-sm text-emerald-600">
            ✓ {t("noAllergyMatch")}
          </div>
        )}
      </Card>
    </div>
  );
}

type Turn = { role: "assistant" | "user"; content: string };
type TriageResult =
  | { done: false; question: string; options?: string[]; rationale?: string }
  | {
      done: true;
      assessment: {
        likely_conditions?: { name: string; confidence?: number; reason?: string }[];
        red_flags?: string[];
        refer_to_doctor?: boolean;
        recommendations?: {
          drug: string;
          dose?: string;
          frequency?: string;
          duration?: string;
          notes?: string;
        }[];
        lifestyle_advice?: string[];
        warnings?: string[];
      };
    };

function SmartTriage({ lang }: { lang: "ar" | "en" }) {
  const { t } = useI18n();
  const triage = useServerFn(smartTriage);

  const [started, setStarted] = useState(false);
  const [patient, setPatient] = useState({
    age: "",
    weight: "",
    sex: "" as "" | "male" | "female",
    pregnant: false,
    chiefComplaint: "",
    currentMeds: "",
    allergies: "",
  });
  const [history, setHistory] = useState<Turn[]>([]);
  const [current, setCurrent] = useState<TriageResult | null>(null);
  const [answer, setAnswer] = useState("");

  const mut = useMutation({
    mutationFn: async (userAnswer?: string) => {
      const p = {
        age: patient.age ? Number(patient.age) : undefined,
        weight: patient.weight ? Number(patient.weight) : undefined,
        sex: (patient.sex || undefined) as any,
        pregnant: patient.pregnant || undefined,
        chiefComplaint: patient.chiefComplaint || undefined,
        currentMeds: patient.currentMeds
          ? patient.currentMeds.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
          : undefined,
        allergies: patient.allergies
          ? patient.allergies.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
          : undefined,
      };
      return triage({
        data: { patient: p, history, answer: userAnswer, lang },
      });
    },
    onSuccess: (res) => {
      setHistory(res.history as Turn[]);
      setCurrent(res.result as TriageResult);
      setAnswer("");
    },
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });

  const begin = () => {
    if (!patient.chiefComplaint.trim()) {
      toast.error(t("requiredField"));
      return;
    }
    setStarted(true);
    setHistory([]);
    setCurrent(null);
    mut.mutate(undefined);
  };

  const reset = () => {
    setStarted(false);
    setHistory([]);
    setCurrent(null);
    setAnswer("");
  };

  const send = (v: string) => {
    if (!v.trim()) return;
    mut.mutate(v.trim());
  };

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      <Card className="lg:col-span-2 p-5 space-y-3 border-border/60 h-fit">
        <div className="flex items-center gap-2 font-bold">
          <User className="h-4 w-4 text-primary" /> {t("patient")}
        </div>
        <p className="text-xs text-muted-foreground -mt-2">{t("smartTriageDesc")}</p>

        <div>
          <Label>{t("chiefComplaint")} *</Label>
          <Textarea
            rows={2}
            placeholder={t("chiefComplaintPh")}
            value={patient.chiefComplaint}
            onChange={(e) =>
              setPatient({ ...patient, chiefComplaint: e.target.value })
            }
            disabled={started}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>{t("age")}</Label>
            <Input
              type="number"
              value={patient.age}
              onChange={(e) => setPatient({ ...patient, age: e.target.value })}
              disabled={started}
            />
          </div>
          <div>
            <Label>{t("weight")}</Label>
            <Input
              type="number"
              value={patient.weight}
              onChange={(e) => setPatient({ ...patient, weight: e.target.value })}
              disabled={started}
            />
          </div>
        </div>

        <div>
          <Label>{t("sex")}</Label>
          <Select
            value={patient.sex}
            onValueChange={(v: any) => setPatient({ ...patient, sex: v })}
            disabled={started}
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t("male")}</SelectItem>
              <SelectItem value="female">{t("female")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {patient.sex === "female" && (
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <Label className="cursor-pointer">{t("pregnant")}</Label>
            <Switch
              checked={patient.pregnant}
              onCheckedChange={(v) => setPatient({ ...patient, pregnant: v })}
              disabled={started}
            />
          </div>
        )}

        <div>
          <Label>{t("allergies")}</Label>
          <Input
            placeholder="penicillin, sulfa..."
            value={patient.allergies}
            onChange={(e) => setPatient({ ...patient, allergies: e.target.value })}
            disabled={started}
          />
        </div>
        <div>
          <Label>{t("currentMeds")}</Label>
          <Input
            placeholder="metformin, aspirin..."
            value={patient.currentMeds}
            onChange={(e) => setPatient({ ...patient, currentMeds: e.target.value })}
            disabled={started}
          />
        </div>

        {!started ? (
          <Button
            onClick={begin}
            disabled={mut.isPending}
            className="w-full gap-2 gradient-primary"
          >
            <Sparkles className="h-4 w-4" /> {t("startTriage")}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={reset}
            className="w-full gap-2"
          >
            <RotateCcw className="h-4 w-4" /> {t("resetTriage")}
          </Button>
        )}
      </Card>

      <Card className="lg:col-span-3 p-5 border-border/60 min-h-[26rem] flex flex-col">
        {!started ? (
          <div className="flex-1 grid place-items-center text-center text-muted-foreground">
            <div>
              <Brain className="h-14 w-14 mx-auto mb-3 text-primary/40" />
              <p className="max-w-sm mx-auto text-sm">{t("smartTriageDesc")}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[28rem] pe-1">
              {history.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full ${
                      m.role === "assistant"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] ${
                      m.role === "assistant"
                        ? "bg-primary/10 text-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {mut.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("aiAsking")}
                </div>
              )}
            </div>

            {current && !current.done && (
              <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                {current.rationale && (
                  <p className="text-[11px] text-muted-foreground italic">
                    💡 {t("reasoning")}: {current.rationale}
                  </p>
                )}
                {current.options && current.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {current.options.map((o) => (
                      <Button
                        key={o}
                        variant="secondary"
                        size="sm"
                        className="rounded-full"
                        onClick={() => send(o)}
                        disabled={mut.isPending}
                      >
                        {o}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        send(answer);
                      }
                    }}
                    placeholder={t("yourAnswer")}
                    disabled={mut.isPending}
                  />
                  <Button
                    onClick={() => send(answer)}
                    disabled={!answer.trim() || mut.isPending}
                    className="gap-1 gradient-primary"
                  >
                    <Send className="h-4 w-4" /> {t("send")}
                  </Button>
                </div>
              </div>
            )}

            {current && current.done && (
              <FinalAssessment assessment={current.assessment} />
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function FinalAssessment({
  assessment,
}: {
  assessment: Extract<TriageResult, { done: true }>["assessment"];
}) {
  const { t } = useI18n();
  return (
    <div className="mt-3 border-t border-border/60 pt-3 space-y-3">
      {assessment.refer_to_doctor && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-700 p-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="h-4 w-4" /> {t("referDoctor")}
        </div>
      )}

      {assessment.red_flags && assessment.red_flags.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="font-bold text-sm mb-1 flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" /> {t("redFlags")}
          </div>
          <ul className="text-xs list-disc ps-5 space-y-0.5 text-amber-800">
            {assessment.red_flags.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {assessment.likely_conditions && assessment.likely_conditions.length > 0 && (
        <div>
          <div className="font-bold text-sm mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" /> {t("likelyCondition")}
          </div>
          <div className="space-y-2">
            {assessment.likely_conditions.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-primary/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{c.name}</div>
                  {typeof c.confidence === "number" && (
                    <Badge variant="outline" className="text-[10px]">
                      {t("confidence")}: {Math.round(c.confidence * 100)}%
                    </Badge>
                  )}
                </div>
                {c.reason && (
                  <p className="text-xs text-muted-foreground mt-1">{c.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <div>
          <div className="font-bold text-sm mb-2 flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" /> {t("recommendedMeds")}
          </div>
          <div className="space-y-2">
            {assessment.recommendations.map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3"
              >
                <div className="font-bold text-sm">{r.drug}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {r.dose && <span>💊 {r.dose}</span>}
                  {r.frequency && <span>🕐 {r.frequency}</span>}
                  {r.duration && <span>📅 {r.duration}</span>}
                </div>
                {r.notes && (
                  <p className="text-xs mt-1 italic text-foreground/80">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.lifestyle_advice && assessment.lifestyle_advice.length > 0 && (
        <div>
          <div className="font-bold text-sm mb-1">🌿 {t("lifestyleAdvice")}</div>
          <ul className="text-xs list-disc ps-5 space-y-0.5">
            {assessment.lifestyle_advice.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {assessment.warnings && assessment.warnings.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
          <div className="font-bold text-sm mb-1">⚠ {t("warnings")}</div>
          <ul className="text-xs list-disc ps-5 space-y-0.5">
            {assessment.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Refill Tracker: monitors chronic prescriptions and shows
// which patients are due for their next monthly refill.
// ─────────────────────────────────────────────────────────────
function RefillTracker() {
  const { t, lang } = useI18n();

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["refill-prescriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select("id, customer_id, medication, is_chronic, last_filled, refill_interval_days, customers(name)")
        .eq("is_chronic", true)
        .order("last_filled", { ascending: true })
        .limit(80);
      return data ?? [];
    },
  });

  function daysSinceFill(lastFilled?: string | null): number | null {
    if (!lastFilled) return null;
    return Math.floor((Date.now() - new Date(lastFilled).getTime()) / 86400000);
  }

  function refillStatus(days: number | null, interval: number) {
    if (days === null) return "unknown";
    if (days >= interval) return "due";
    if (days >= interval - 7) return "soon";
    return "ok";
  }

  const sorted = [...prescriptions].sort((a: any, b: any) => {
    const da = daysSinceFill((a as any).last_filled) ?? 0;
    const db = daysSinceFill((b as any).last_filled) ?? 0;
    return db - da;
  });

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">
          {lang === "ar"
            ? "يتم متابعة الوصفات المزمنة تلقائياً — يظهر هنا المرضى الذين يستحقون إعادة الصرف"
            : "Chronic prescriptions are tracked automatically — patients due for a refill appear here"}
        </span>
      </div>

      {isLoading && (
        <p className="text-center text-muted-foreground py-8">{t("loading")}</p>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            {lang === "ar"
              ? "لا توجد وصفات مزمنة مسجلة. افتح صفحة الوصفات وضع علامة \"مزمن\" على الوصفة."
              : "No chronic prescriptions found. Open Prescriptions and mark as Chronic."}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((rx: any) => {
          const days = daysSinceFill(rx.last_filled);
          const interval = rx.refill_interval_days ?? 30;
          const status = refillStatus(days, interval);
          const remaining = days !== null ? Math.max(0, interval - days) : null;

          return (
            <div
              key={rx.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                status === "due"
                  ? "border-rose-400/50 bg-rose-50 dark:bg-rose-900/20"
                  : status === "soon"
                  ? "border-amber-400/50 bg-amber-50 dark:bg-amber-900/20"
                  : "border-border/60 bg-card"
              }`}
            >
              <div
                className={`grid h-9 w-9 place-items-center rounded-full shrink-0 ${
                  status === "due"
                    ? "bg-rose-500/15 text-rose-600"
                    : status === "soon"
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-emerald-500/15 text-emerald-600"
                }`}
              >
                {status === "due" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {rx.customers?.name ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground truncate">{rx.medication}</div>
              </div>

              <div className="text-end shrink-0">
                {status === "due" ? (
                  <span className="text-xs font-bold text-rose-600">
                    {lang === "ar" ? `متأخر ${days! - interval} يوم` : `${days! - interval}d overdue`}
                  </span>
                ) : remaining !== null ? (
                  <span className="text-xs text-muted-foreground">
                    {lang === "ar" ? `بعد ${remaining} يوم` : `in ${remaining}d`}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              <a
                href="/pos"
                className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shrink-0"
                title={lang === "ar" ? "صرف مكرر سريع" : "Quick Refill"}
              >
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
