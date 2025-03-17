import { BlankNode, Quad_Object, Quad_Subject, Triple } from "n3"
import { ODRL, RDF, XSD } from "@inrupt/vocab-common-rdf";
import { v4 as uuidv4 } from 'uuid';
import moment from "moment";
import { DataFactory } from "n3";
import { createRDFList } from "./trigUtils";

const { namedNode, blankNode, literal, triple } = DataFactory;

/**
 * Create simple policy managing duration and purpose requirements for contained data
 * 
 * @param policyOptions 
 * @returns 
 */
export function createSimplePolicy(
    policyOptions: { 
        targets: Quad_Object[], 
        assigner?: string, 
        assignee?: string, 
        duration?: string, 
        purpose?: string[]
    }) : { subject: Quad_Subject, triples: Triple[] } {
  
    const {targets, duration, purpose, assigner, assignee} = policyOptions;
    
    // Create graph to store policy information
    let policyGraph: Triple[] = []

    const constraints: Quad_Subject[] = []

    // Add duration constraint
    if (duration) {

        const m = moment()
        m.add(duration)
        const endDate = m.toISOString()
        const constraintSubject = blankNode()
        // policyGraph = policyGraph.concat([
        //     triple(constraintSubject, namedNode(ODRL.leftOperand), namedNode(ODRL.elapsedTime)),
        //     triple(constraintSubject, namedNode(ODRL.operator), namedNode(ODRL.eq)),
        //     triple(constraintSubject, namedNode(ODRL.rightOperand), literal(duration, namedNode(XSD.duration)))
        // ])
        policyGraph = policyGraph.concat([
            triple(constraintSubject, namedNode(RDF.type), namedNode(ODRL.Constraint)),
            triple(constraintSubject, namedNode(ODRL.leftOperand), namedNode(ODRL.dateTime)),
            triple(constraintSubject, namedNode(ODRL.operator), namedNode(ODRL.lt)),
            triple(constraintSubject, namedNode(ODRL.rightOperand), literal(endDate, namedNode(XSD.dateTime)))
        ])
        constraints.push(constraintSubject)
    }
    
    // Add purpose constraint
    if (purpose && purpose.length) {
        const constraintSubject = blankNode()
        if (purpose.length === 1) {
            policyGraph = policyGraph.concat([
                triple(constraintSubject, namedNode(RDF.type), namedNode(ODRL.Constraint)),
                triple(constraintSubject, namedNode(ODRL.leftOperand), namedNode("https://w3id.org/oac#Purpose")),
                triple(constraintSubject, namedNode(ODRL.operator), namedNode(ODRL.eq)),
                triple(constraintSubject, namedNode(ODRL.rightOperand), namedNode(purpose[0]))
            ])

        } else {

            const purposeConstraints: BlankNode[] = []

            // create list of constraints
            for (let specificPurpose of purpose) {
                let purposeConstraintSubj = blankNode()
                policyGraph = policyGraph.concat([
                    triple(purposeConstraintSubj, namedNode(RDF.type), namedNode(ODRL.Constraint)),
                    triple(purposeConstraintSubj, namedNode(ODRL.leftOperand), namedNode("https://w3id.org/oac#Purpose")),
                    triple(purposeConstraintSubj, namedNode(ODRL.operator), namedNode(ODRL.eq)),
                    triple(purposeConstraintSubj, namedNode(ODRL.rightOperand), namedNode(specificPurpose))
                ])
                purposeConstraints.push(purposeConstraintSubj)
            } 
            // create list of purpose constraints
            const purposeConstraintsList = createRDFList(purposeConstraints);
            if (!purposeConstraintsList.subject) throw new Error('Cannot create empty list of purposes.')
            // add list to graph
            policyGraph = policyGraph.concat(purposeConstraintsList.quads)
            // define list as OR
            policyGraph.push(triple(constraintSubject, namedNode(ODRL.or), purposeConstraintsList.subject))

        }
        constraints.push(constraintSubject)
    }
    
    // Create Permission
    const permissionSubject = blankNode();
    for (let target of targets) {
        policyGraph.push(triple(permissionSubject, namedNode(ODRL.target), target))
    }
    
    policyGraph.push(triple(permissionSubject, namedNode(ODRL.action), namedNode(ODRL.use)))
    policyGraph.push(triple(permissionSubject, namedNode(ODRL.action), namedNode(ODRL.read)))
    if (assigner) policyGraph.push(triple(permissionSubject, namedNode(ODRL.assigner), namedNode(assigner)))
    if (assignee) policyGraph.push(triple(permissionSubject, namedNode(ODRL.assignee), namedNode(assignee)))
        
    // append constraints to permission
    if (constraints.length) {
        if (constraints.length > 1) {
            const constraintAndSubject = blankNode()
            const constraintList = createRDFList(constraints);
            if (!constraintList.subject) throw new Error('Cannot create empty list of purposes.')
            // add list to graph
            policyGraph = policyGraph.concat(constraintList.quads)
            // define list as OR
            policyGraph.push(triple(constraintAndSubject, namedNode(ODRL.and), constraintList.subject))
            policyGraph.push(triple(permissionSubject, namedNode(ODRL.constraint), constraintAndSubject))

        } else {
            policyGraph.push(triple(permissionSubject, namedNode(ODRL.constraint), constraints[0]))
        }
    }

    // Create Agreement
    const agreementSubject = blankNode()
    policyGraph.push(triple(agreementSubject, namedNode(RDF.type), namedNode(ODRL.Agreement)))
    policyGraph.push(triple(agreementSubject, namedNode(ODRL.uid), generateUrnUuid()))
    policyGraph.push(triple(agreementSubject, namedNode(ODRL.permission), permissionSubject))


    return { subject: agreementSubject, triples: policyGraph }
}



export function generateUrnUuid() {
    return DataFactory.namedNode(`urn:policy:${uuidv4()}`)
}