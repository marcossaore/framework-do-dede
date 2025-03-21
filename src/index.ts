import { Registry } from "./di/registry";
import { Auth, Controller, Delete, Get, Post, Put, Validator } from "@/decorators";
import { HttpMiddleware, UseCase, Validation } from '@/protocols';
import { HttpServer, ServerError } from '@/http';
import { UseCaseHandler, ControllerHandler } from "@/handlers";

Registry.register('controllers', []);

export {
    Registry,
    Auth,
    Controller,
    Delete,
    Get,
    Post,
    Put,
    Validator,
    HttpMiddleware,
    UseCase,
    Validation,
    HttpServer,
    ServerError,
    UseCaseHandler,
    ControllerHandler
}