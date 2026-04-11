"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  updateGoalProgressSchema,
  UpdateGoalProgressForm,
  TeamGoal,
} from "../types";

interface UpdateGoalProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: TeamGoal | null;
  onSubmit: (goalId: string, currentValue: number) => void;
}

export function UpdateGoalProgressDialog({
  open,
  onOpenChange,
  goal,
  onSubmit,
}: UpdateGoalProgressDialogProps) {
  const form = useForm<UpdateGoalProgressForm>({
    resolver: zodResolver(updateGoalProgressSchema),
    defaultValues: { currentValue: goal?.currentValue ?? 0 },
  });

  React.useEffect(() => {
    if (goal) {
      form.setValue("currentValue", goal.currentValue);
    }
  }, [goal, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-white">Actualizar Progreso</DialogTitle>
          <DialogDescription className="text-slate-400">{goal?.title}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              if (goal) {
                onSubmit(goal.id, data.currentValue);
                onOpenChange(false);
              }
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Valor Actual</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription className="text-slate-400">
                    Objetivo: {goal?.targetValue} ({goal?.unit})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-violet-500 hover:bg-violet-600">
                Actualizar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
